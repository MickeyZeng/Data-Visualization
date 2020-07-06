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
