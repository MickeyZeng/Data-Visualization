import json
import os
import shutil

import numpy as np
import pandas
from PIL import Image
from matplotlib import pyplot as plt


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
def processScribble(originalImageHeight, originalImageWidth, fileName, pointPositioin, drawingPanelWidth, imgData,
                    classLabel):
    """
    This function would applied all the parameter and create a JSON file saving all the point positions in user computer
    :param classLabel: The JSON file has to include the ground truth of the picture (JSON file必须包含当前这个scribble的ground truth)
    :param imgData: This is to save the imgData (这个是存储图片的3 dimension数组)
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
        tempList = {'x': pointPositioin[i]['x'] * widthRatio, 'y': pointPositioin[i]['y'] * heightRatio}
        resultList.append(tempList)

    # print(resultList)

    """
    Test if the data in resultList is correct or not
    测试resultList里面的数据的点回到原来的图片比例后是否正确
    """
    checkResultList(resultList, imgData, originalImageHeight, originalImageWidth)

    # 还没有完成的 要在resultList里面加紧 当前是positive还是negative 和 这个scribble是为了什么ground Truth (后面要完成写的！！)

    # JSON serializable
    resultList = json.dumps(resultList, indent=2)

    # Create JSON File
    response = saved_file(fileName, resultList)

    return response


# TODO: This is to create JSON file
def saved_file(fileName, resultList):
    """
    This is function is to write the data in file and download it
    :param fileName: It will be a name of JSON file
    :param resultList: The JSON serializable result will be write in a file
    :return:
    """
    """
    The files in directory named DownloadFile will be remove first
    首先清空了downloadFile里面的所有文件
    """
    shutil.rmtree("downloadFile")
    os.mkdir("downloadFile")

    """
    Create an file in directory named DownloadFile
    创建JSON文件到DownloadFile的文件夹下面
    """
    fileObject = open('downloadFile/' + fileName + '.json', 'w')
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
        plt.plot(resultList[i]['x'], resultList[i]['y'], '.r-')
        print(resultList[i])
    plt.legend()
    plt.show()
