import json

import numpy as np
import pandas


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


# TODO: This is to Read the CSV file (这里是处理上传上来的CSV文件)
def readFile(file):
    # This is to read a certain file
    df = pandas.read_csv(file)
    # df = pandas.read_csv('test.csv')
    name = df['Ground Truth'].tolist()
    path = df['Path'].tolist()

    result = [name, path]

    return result


# TODO: This is to save Scribble (这里是接受上传上来的图片数据 然后保存Scribble为JSON并保存本地)
def processScribble(originalImageHeight, originalImageWidth, fileName, pointPositioin, drawingPanelWidth, request):
    """
    This function would applied all the parameter and create a JSON file saving all the point positions in user computer
    :param request: This is to let the user select the download position (传送前端的请求 然后让用户选择JSON文件下载的地方)
    :param originalImageHeight: Original Image Height (图片的原始高度)
    :param originalImageWidth: Original Image Width (图片的原始宽度)
    :param fileName: The name of file, which will be json File  (该图片的名字)
    :param pointPositioin: A set include all position of sets   (这是一个Set 里面保存每一个点的X 和 Y 坐标)
    :param drawingPanelWidth: The width of drawing panel    (这是原始的画框的宽度 因为这是一个正方形 所以只需要宽度就足够了)
    :return: TRUE OR FALSE
    """

    """
    Calculate the ratio of Width (Original/Panel) 
    这个是计算比例(Original/Panel) Original的为分子 Panel为分母
    Because the panel is square, the width equals height
    因为画板是正方形 所以长宽是相同的
    """
    widthRatio = originalImageWidth / drawingPanelWidth
    heightRatio = originalImageHeight / drawingPanelWidth
    resultList = []

    for i in range(len(pointPositioin)):
        tempList = {}
        tempList['x'] = pointPositioin[i]['x'] * widthRatio
        tempList['y'] = pointPositioin[i]['y'] * heightRatio
        resultList.append(tempList)

    # print(resultList)

    resultList = json.dumps(resultList, indent=2)

    response = download_file(request, fileName, resultList)

    return response


# TODO: This is to download the file
def download_file(request, fileName, resultList):
    """
    This is function is to write the data in file and download it
    :param request:
    :param fileName:
    :param resultList:
    :return:
    """
    fileObject = open('testData/' + fileName + '.json', 'w')
    fileObject.write(resultList)
    fileObject.close()

    return True
