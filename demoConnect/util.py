import json

import numpy as np

# TODO: This is to transform array to tensor (太多地方用到 封装为方法 防止过多的复制)
def arrToTensor(imgData, width, height):
    imgData = json.loads(imgData)
    # print(type(imgData))
    # print(str(len(imgData[551][498])) + "1!!22###")

    # print(str(width) + str(height) + "WIDTH &&&& HEIGHT")
    picData = np.zeros((int(width), int(height), 3))

    for i in range(int(width)):
        for j in range(int(height)):
            for k in range(3):
                picData[i][j][k] = int(imgData[i][j][k])

    # print(picData)

    return picData