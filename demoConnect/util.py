import json
import os
import sys

import cv2
import numpy as np
import pandas
from PIL import Image
from django.http import FileResponse
from django.http import Http404
from matplotlib import pyplot as plt

from ResNet50 import json_to_dict as jd
from demoConnect.settings import BASE_DIR

# Judge if the file is changed or not (判断是否上传了新的CSV)
df = 0


# TODO: This is to transform array to tensor (太多地方用到 封装为方法 防止过多的复制)
def arrToTensor(imgData, width, height):
    imgData = json.loads(imgData)

    # print(str(width) + str(height) + "WIDTH &&&& HEIGHT")
    picData = np.zeros((int(width), int(height), 3))

    for i in range(int(width)):
        for j in range(int(height)):
            for k in range(3):
                picData[i][j][k] = int(imgData[i][j][k])

    # print(picData)

    return picData


# TODO: This is to Read the CSV file (这里是处理上传上来的CSV文件, 然后返回一个一个文件类型的参数)
def readFile(file, current_index, abs_path):
    # This is to read a certain file
    global df
    if file != 0:
        df = pandas.read_csv(file)

    if len(df) == 0 and file == 0:
        return Http404
    # df = pandas.read_csv('test.csv')
    # / Users / mickey / Downloads / dataSet 测试路径
    name = df['label'].tolist()
    # name = df['Ground Truth'].tolist()
    path = df['image_path'].tolist()

    resultName = name[int(current_index)]
    resultPath = abs_path + path[int(current_index)]
    fileName = path[int(current_index)].split('/')[0]

    print("the name of file is " + fileName)

    """
    通过resultName & resultPath 获取文件类型
    """
    try:
        response = FileResponse(open(resultPath, 'rb'))
        response['Content-Type'] = 'application/octet-stream'  # 设置头信息，告诉浏览器这是个文件
        response['labelName'] = resultName
        response['fileLength'] = len(name)
        response['fileName'] = fileName
        response.as_attachment = False
        return response
    except Exception:
        raise Http404


# TODO: This is to create a numpy saving postive and negative scribble (Type for line)
def processNumpy(originalImageHeight, originalImageWidth, fileName, positivePointPosition, negativePointPositive,
                 drawingPanelWidth, imgData, classLabel, flag, typeScribble):
    resultList = {}

    # 如果是Customized的话 需要走另外的json
    index = jd.dis_index(classLabel, flag=flag)

    labelInfoList = {'index': index}

    positiveList = calculatedPosition(originalImageWidth, originalImageHeight, drawingPanelWidth, positivePointPosition,
                                      'positive')

    negativeList = calculatedPosition(originalImageWidth, originalImageHeight, drawingPanelWidth, negativePointPositive,
                                      'negative')

    if typeScribble == "box":
        testNumpy = np.ones((int(originalImageHeight), int(originalImageWidth)), dtype=np.int8)

        testNumpy = createBox(positiveList, negativeList, testNumpy)

    else:
        testNumpy = np.zeros((int(originalImageHeight), int(originalImageWidth)), dtype=np.int8)

        testNumpy = createNumpy(positiveList, negativeList, testNumpy)

    return testNumpy


# TODO: Read the list and put the number in numpy array
def createBox(positive, negative, testNumpy):
    minX = sys.maxsize
    maxX = 0
    minY = sys.maxsize
    maxY = 0

    # 只能让positive画
    for i in range(len(positive['positive']) - 1):
        if positive['positive'][i] == 'break':
            continue
        if positive['positive'][i + 1] == 'break':
            continue

        if int(positive['positive'][i]['x']) > maxX:
            maxX = int(positive['positive'][i]['x'])
        if int(positive['positive'][i]['x']) < minX:
            minX = int(positive['positive'][i]['x'])

        if int(positive['positive'][i]['y']) > maxY:
            maxY = int(positive['positive'][i]['y'])
        if int(positive['positive'][i]['y']) < minY:
            minY = int(positive['positive'][i]['y'])
        # start_point = (int(positive['positive'][i]['x']), int(positive['positive'][i]['y']))
        # end_point = (int(positive['positive'][i + 1]['x']), int(positive['positive'][i + 1]['y']))

    if minX == sys.maxsize and maxX == 0 and minY == sys.maxsize and maxY == 0:
        testNumpy = np.zeros(testNumpy.shape, dtype=np.int8)
    else:
        thickness = -1
        # Positive scribble is 2
        testNumpy = cv2.rectangle(testNumpy, (minX, minY), (maxX, maxY), 2, thickness)

    return testNumpy


# TODO: Read the list and put the number in numpy array
def createNumpy(positive, negative, testNumpy):
    for i in range(len(positive['positive']) - 1):
        if positive['positive'][i] == 'break':
            continue
        if positive['positive'][i + 1] == 'break':
            continue
        start_point = (int(positive['positive'][i]['x']), int(positive['positive'][i]['y']))
        end_point = (int(positive['positive'][i + 1]['x']), int(positive['positive'][i + 1]['y']))
        thickness = 2
        # Positive scribble is 2
        testNumpy = cv2.line(testNumpy, start_point, end_point, 2, thickness)

    for i in range(len(negative['negative']) - 1):
        if negative['negative'][i] == 'break':
            continue
        if negative['negative'][i + 1] == 'break':
            continue
        start_point = (int(negative['negative'][i]['x']), int(negative['negative'][i]['y']))
        end_point = (int(negative['negative'][i + 1]['x']), int(negative['negative'][i + 1]['y']))
        thickness = 2
        # Negative scribble is 1
        testNumpy = cv2.line(testNumpy, start_point, end_point, 1, thickness)

    # for i in positive['positive']:
    #     if i != 'break':
    #         testNumpy[int(i['y'])][int(i['x'])] = 1
    #
    # for i in negative['negative']:
    #     if i != 'break':
    #         testNumpy[int(i['y'])][int(i['x'])] = -1

    return testNumpy


# TODO: This is to save Scribble (这里是接受上传上来的图片数据 然后保存Scribble为JSON并保存本地)
def processScribble(originalImageHeight, originalImageWidth, fileName, positivePointPosition, negativePointPositive,
                    drawingPanelWidth, imgData, classLabel, flag):
    """
    This function would applied all the parameter and create a JSON file saving all the point positions in user computer
    :param flag:
    :param classLabel: The JSON file has to include the ground truth of the picture (JSON file必须包含当前这个scribble的ground truth)
    :param imgData: This is to save the imgData (这个是存储图片的3 dimension数组)
    :param originalImageHeight: Original Image Height (图片的原始高度)
    :param originalImageWidth: Original Image Width (图片的原始宽度)
    :param fileName: The name of file, which will be json File  (该图片的名字)
    :param positivePointPosition: A set include all position of sets   (这是一个Set 里面保存每一个点的X 和 Y 坐标)
    :param negativePointPositive: Same as positivePointPositioin 和positivePointPositioin一样
    :param drawingPanelWidth: The width of drawing panel    (这是原始的画框的宽度 因为这是一个正方形 所以只需要宽度就足够了)
    :return: TRUE OR FALSE
    """

    resultList = {}

    # 如果是Customized的话 需要走另外的json
    index = jd.dis_index(classLabel, flag=flag)

    labelInfoList = {'index': index}

    positiveList = calculatedPosition(originalImageWidth, originalImageHeight, drawingPanelWidth, positivePointPosition,
                                      'positive')

    negativeList = calculatedPosition(originalImageWidth, originalImageHeight, drawingPanelWidth, negativePointPositive,
                                      'negative')

    tempList = [labelInfoList, positiveList, negativeList]

    # Save the original size in the JSON file
    resultList["originalSize"] = {'width': originalImageWidth, 'height': originalImageHeight}

    # Save the point position and index in JSON file
    resultList[classLabel] = tempList

    """
    Test if the data in resultList is correct or not
    测试resultList里面的数据的点回到原来的图片比例后是否正确
    """
    # checkResultList(positiveList['positive'], imgData, originalImageHeight, originalImageWidth)
    # checkResultList(negativeList['negative'], imgData, originalImageHeight, originalImageWidth)

    # JSON serializable
    resultList = json.dumps(resultList, indent=2)

    # Create JSON File
    response = saved_file(fileName, resultList)

    return response


# TODO: This is process the point position
def calculatedPosition(originalImageWidth, originalImageHeight, drawingPanelWidth, pointPosition, style):
    """
    Calculate the ratio of Width (Original/Panel)
    这个是计算比例(Original/Panel) Original的为分子 Panel为分母
    Because the panel is square, the width equals height
    因为画板是正方形 所以长宽是相同的
    """
    tempResult = {}
    resultList = []

    drawingPanelHeight = drawingPanelWidth

    # source_size = [originalImageWidth, originalImageHeight]
    # max_size = max(source_size)
    # new_size = (max_size, max_size)
    #
    # start_x = int((new_size[0] - source_size[0]) / 2)
    # end_x = start_x + source_size[0]
    #
    # start_y = int((new_size[1] - source_size[1]) / 2)
    # end_y = start_y + source_size[1]
    #
    # testNumpy = [np.array([[p['x'], p['y']]]) for p in pointPosition if p != 'break']
    # testNumpy = np.concatenate(testNumpy)
    #
    # testNumpy = testNumpy.astype(np.float) / drawingPanelWidth * max_size - np.array([[start_x, start_y]])
    # tempResult = testNumpy.tolist()
    #
    # return tempResult

    padding = 0
    if originalImageWidth < originalImageHeight:
        padding = (drawingPanelWidth - drawingPanelWidth * (originalImageWidth / originalImageHeight)) / 2
        drawingPanelWidth = drawingPanelWidth - (padding * 2)
        for i in range(len(pointPosition)):
            if pointPosition[i] == 'break':
                continue
            pointPosition[i]['x'] = pointPosition[i]['x'] - padding
    else:
        padding = (drawingPanelHeight - (drawingPanelHeight * (originalImageHeight / originalImageWidth))) / 2
        drawingPanelHeight = drawingPanelHeight - (padding * 2)
        for i in range(len(pointPosition)):
            if pointPosition[i] == 'break':
                continue
            pointPosition[i]['y'] = pointPosition[i]['y'] - padding

    widthRatio = originalImageWidth / drawingPanelWidth
    heightRatio = originalImageHeight / drawingPanelHeight

    for i in range(len(pointPosition)):
        if pointPosition[i] == 'break':
            tempList = 'break'
            # print(pointPosition[i])
        else:
            tempList = {'x': pointPosition[i]['x'] * widthRatio, 'y': pointPosition[i]['y'] * heightRatio}
        resultList.append(tempList)

    tempResult[style] = resultList
    return tempResult


# TODO: This is to create JSON file
def saved_file(fileName, resultList):
    """
    This is function is to write the data in file and download it
    :param fileName: It will be a name of JSON file
    :param resultList: The JSON serializable result will be write in a file
    :return:
    """

    """
    Create an file in directory named DownloadFile
    创建JSON文件到DownloadFile的文件夹下面
    """
    fileObject = open('downloadFile/' + fileName + '.json', 'a')
    fileObject.write(resultList)
    fileObject.close()

    return True


# TODO: Implement PLT to display and check if the data in result List is correct or not (测试ResultList里面的数据是否是正确的)
def checkResultList(resultList, imgData, originalImageHeight, originalImageWidth):
    # 把图片标准按原图显示
    pic = Image.fromarray(imgData.astype('uint8'), 'RGB').rotate(270).transpose(Image.FLIP_LEFT_RIGHT)
    pic = pic.resize((originalImageWidth, originalImageHeight), Image.ANTIALIAS)
    plt.imshow(pic)
    # plt.plot(100, 100, 'ro')
    for i in range(len(resultList)):
        if 'break' not in resultList[i]:
            print(resultList[i])
            plt.plot(resultList[i]['x'], resultList[i]['y'], '.r-')
        # print(resultList[i])
    plt.legend()
    plt.show()


# TODO: PROCESS the custom neural network File
def processFile(arch, weights, label):
    # 2. Check the type of file (查看文件类型)
    if (getFileName(arch) != "py") or (getFileName(weights) != "pth") or (getFileName(label) != "json"):
        return False

    # 3. Check if there is a function named getNetwork in arch file (检查arch文件是否有getNetWork函数)
    download_file(arch, 'arch.py')
    download_file(weights, 'weight.pth')
    download_file(label, 'label.json')

    # 4. Check if there is a function named "get_network" in the arch file (检查arch文件里面是否有一个叫"get_network"的方法)
    import customNetwork.arch as ca
    try:
        test = ca.get_network()
    except IOError:
        print("There is no function named get_network in arch file.")
        return False
    return True


# TODO: To extract the name of file 得到后缀名
def getFileName(file):
    fileName = file._get_name().split(".")[-1]
    # print(fileName)
    return fileName


# TODO: Download the file in a directory
def download_file(file, name):
    dir = os.path.join(os.path.join(BASE_DIR, 'customNetwork'))
    destination = open(os.path.join(dir, name), 'wb+')
    for chunk in file.chunks():
        destination.write(chunk)
    destination.close()
    return True


# TODO: Some function for only two label (专门是为了二分问题设计的 转化显示出来的概率)
def transfer_rate(input):
    # value = input.squeeze().detach().numpy()
    #
    # if value > 0.5:
    #     input = torch.tensor([value, 1 - value])
    # else:
    #     input = torch.tensor([1 - value, value])

    return input
