"""
This is the source for machine learning
 这个代码是为了 机器学习识别 的后台代码
"""

import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
import numpy as np
from matplotlib import pyplot as plt
import ResNet50.json_to_dict as jtd
from PIL import Image
from torchsummary import summary
import json
import math

# import matplotlib

# matplotlib.use('agg')

numOfResult = 0
rank = 0
picData = 0


def mc_Resnet50(img):
    """
    :TODO: Process the file by resNet
    :param img (3D array):
    :return: the result in JSON
    """
    # resnet50 = torch.hub.load('pytorch/vision:v0.6.0', 'resnet152', pretrained=True)
    resnet50 = models.resnet50(pretrained=True)
    # resnet50.load_state_dict(torch.load('resnet152.pth'))
    # This sentence can let you have right label in final
    resnet50.eval()

    pic = Image.fromarray(img.astype('uint8'), 'RGB')
    pic = pic.resize((224, 224), Image.ANTIALIAS).rotate(270)
    pic = pic.transpose(Image.FLIP_LEFT_RIGHT)
    plt.imshow(pic)
    plt.show()

    normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                     std=[0.229, 0.224, 0.225])

    t = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        normalize,
    ])

    input_image = t(pic)
    input_image = input_image.unsqueeze(0)

    with torch.no_grad():
        outputs = resnet50(input_image)

    outputs = torch.stack([nn.Softmax(dim=0)(i) for i in outputs])

    outputs = outputs.squeeze()

    top_k = 10
    top_k = top_k * (-1)
    outputs_numpy = outputs.detach().numpy()

    top_k_idx = outputs_numpy.argsort()[top_k:][::-1]
    print(top_k_idx)

    # 控制在三位
    outputs_numpy = np.around(outputs_numpy, 3)

    # Got the json file by the path
    dictionary = jtd.json_to_dict("ResNet50/imagenet-simple-labels.json")
    result = []
    resultRate = []
    # for i in range(top_k_idx):
    #     resultRate.append(outputs_numpy[i])

    for i in range((top_k * (-1))):
        # 因为Json的是从1开始的 所以需要-1
        result.append(dictionary[top_k_idx[i]])

    for j in top_k_idx:
        resultRate.append(str(outputs_numpy[j]))

    # print(result)
    # print(outputs_numpy[top_k_idx])
    # print(resultRate)
    # print(top_k_idx)

    resultDict = []
    tempdir = {'label': result, 'rate': resultRate}
    resultDict.append(tempdir)

    print(resultDict)

    return resultDict


def displayNet():
    """
    :TODO: display details by function of summary
    :return:
    """
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    stuResnet = models.resnet50().eval().to(device)

    return summary(stuResnet, (3, 244, 244))


def outputNet():
    """
    :TODO: 会以Dictionary中 保存resnet50结构, save the data in JSON
    :return: a dictionary for the structure of resnet
    """

    # 用一个字典去存数据 以方便json返回去前端 再加一个为了dic的index
    dictNet = {}
    dicIndex = 0
    # 暂存一个最大的list
    res = []
    # 层数的index
    index = 0;
    # 这个是给第一层写的
    tempLayers1 = []
    # 这个是给第二层写的
    tempLayers2 = []
    # 这个有第三层
    tempLayers3 = []

    # 这个函数只做打印
    resnet50 = models.resnet50(pretrained=True)
    # This sentence can let you have right label in final
    resnet50.eval()

    resultString = resnet50.__str__()
    resultString = resultString.split('\n')
    # This is to print the structure of ResNet directly

    for i, layers in enumerate(resultString):
        # 不要第一行的ResNet50
        if i == 0:
            continue
        layers = layers.strip(" ")
        layers = layers.rstrip(" ")
        # 如果这一行就是一个完整的括号句子的话 可以直接使用
        if judgeBracket(layers) == 0:
            layers = judgeString(layers)
            if layers == "":
                continue
            # 如果在第一层的话
            if index == 0:
                # 直接加入第一层的结果里面
                res.append(layers)
                # 字典只有第一层存入的时候需要index+1 然后把数据插进去字典
                dictNet[dicIndex] = layers
                dicIndex = dicIndex + 1
            # 如果第二层的话
            elif index == 1:
                # 加入到第二层的结果里面
                tempLayers1.append(layers)
            # 如果第三层的话
            elif index == 2:
                # 加入到第三层的结果里面
                tempLayers2.append(layers)
            elif index == 3:
                # 加入到第四层的结果里面
                tempLayers3.append(layers)

        elif judgeBracket(layers) > 0:
            index = index + 1

            # if layers.find("downsample") > 0 and index == 2:
            #     tempLayers2.append("downsample")
            #
            # if layers.find("downsample") > 0 and index == 3:
            #     tempLayers3.append("downsample")

            if layers.find("Bottleneck") > 0 and index == 2:
                tempLayers2.append("Bottleneck")

            if layers.find("Bottleneck") > 0 and index == 3:
                tempLayers3.append("Bottleneck")

        elif judgeBracket(layers) < 0:
            if index == 1:
                # 字典只有第一层存入的时候需要index+1 然后把数据插进去字典
                dictNet[dicIndex] = tempLayers1
                dicIndex = dicIndex + 1
                # 把第一层的结果暂时先插入到res结果集
                res.append(tempLayers1)
                tempLayers1 = []
            elif index == 2:
                tempLayers1.append(tempLayers2)
                tempLayers2 = []
            elif index == 3:
                tempLayers2.append(tempLayers3)
                tempLayers3 = []
            index = index - 1

    print(dictNet)

    # 返回一个字典到上一级函数
    return dictNet


def judgeString(s):
    """
    :TODO: 这个函数是用来查看每一行的数据是否是Conv2D 或者Relu 或者 Bootleneck
    :param s:
    :return:
    """
    result = ""
    if (s.find("Conv2d") + s.find("MaxPool2d") + s.find("AdaptiveAvgPool2d") + s.find("Linear")) > 0:
        if s.find(":") > 0:
            result = s.split(":")[1]
    return result


def judgeBracket(s):
    """
    :TODO: 这个函数是为了看这一行的数据是否有足够的括号   是完整括号的直接返回0   还有一个做括号的
    :param s:
    :return:
    """
    open_bracket = []
    # 有括号直接弹出-1
    if s == ')':
        return -1

    for char in s:
        if char == '(':
            open_bracket.append("(")
        if char == ')':
            open_bracket.pop()

    if len(open_bracket) > 0:
        # 这个是还有左括号在句子里面的情况
        return len(open_bracket)
    else:
        # 这个是还有完全没有括号在句子里的情况
        return 0


def viz(module, input):
    """
    :TODO: 在resNet里面挂好一个钩 并且在走到这个的时候 写入文件夹
    :param module:
    :param input:
    :return:
    """

    x = input[0][0]
    # 最多显示4张图
    # min_num = np.minimum(4, x.size()[0])

    # 看最多能返回多少张图片传递给前端
    global numOfResult
    numOfResult = np.maximum(0, x.size()[0])

    # 这个是制定返回一层里面的第index个结果
    global rank
    rank = int(rank)

    global picData

    if rank > numOfResult:
        # To prevent the rank user click is bigger than the number of result and set rank in default
        rank = 0
        print("Your rank is bigger than maximum number")
    else:
        # find the exact one and transfer it in an array
        for i in range(numOfResult):
            if rank == i:
                # print("<<<<<<<<")
                # print(type(x[i]))
                # print(x[i].shape)
                # print(">>>>>>>>")
                picData = np.asarray(x[i])

        '''
        # 这一堆代码原始显示 Feature map
        # 这句话让图片在后台显示出来
        fig = plt.imshow(picData, origin='lower')
        # fig = plt.imshow(picData)
        plt.show()
        r = plt.gcf().canvas.get_renderer()
        picData = fig.make_image(r)
        '''
        # picData = misc.format_np_output(picData)
        # print(picData)
        picData = np.expand_dims(picData, axis=0)
        picData = np.repeat(picData, 3, axis=0)
        picData = picData.transpose(1, 2, 0)
        picData = DIVColormap(picData)
        picData = (picData * 2).astype(np.uint8)
        # print(picData.shape)
        print(picData)
        picData = Image.fromarray(picData.astype('uint8'), 'RGB')
        plt.imshow(picData)
        plt.show()


def DIVColormap(array):
    # array[:, :, 0] = 0.75 * np.sin((array[:, :, 0])) + 20
    # array[:, :, 1] = (np.sin(array[:, :, 1] + 0.3) * 20) ** 2
    # array[:, :, 2] = (np.sin(array[:, :, 2] + 0.25) * 17) ** 2

    array[:, :, 0] = 0.75 * np.sin((array[:, :, 0] * 3.5 + 0.25) * np.pi) + 0.5
    array[:, :, 1] = np.sin(array[:, :, 1] * 3.5 * np.pi)
    array[:, :, 2] = 0.75 * np.sin((array[:, :, 2] * 3.5 - 0.25) * np.pi) + 0.5
    return array


def tempOutput(num, img, index):
    """
    :TODO: 这个函数是为了获取任意一层的输出
    :param index:
    :param img:
    :param num:
    :param name:
    :return: 返回总共有多少张图 可以查询
    """
    global rank
    rank = index

    pic = Image.fromarray(img.astype('uint8'), 'RGB')
    pic = pic.resize((224, 224), Image.ANTIALIAS).rotate(270)
    pic = pic.transpose(Image.FLIP_LEFT_RIGHT)
    # 成功显示图片 后面有图片编辑后还需要使用到该功能
    # plt.imshow(img)
    # plt.show()

    normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                     std=[0.229, 0.224, 0.225])

    t = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        normalize,
    ])

    input_image = t(pic)
    input_image = input_image.unsqueeze(dim=0)

    # 这个是来计算应该在用户点击的那一层放上输出标记
    i = 0

    # Create an neural network
    resnet50 = models.resnet50(pretrained=True)
    resnet50.eval()

    # Input output the result of certain layers
    for name, m in resnet50.named_modules():
        if isinstance(m, torch.nn.Conv2d) or isinstance(m, torch.nn.MaxPool2d) \
                or isinstance(m, torch.nn.AdaptiveAvgPool2d) or isinstance(m, torch.nn.Linear) \
                or isinstance(m, torch.nn.ReLU):

            if int(num) == int(i):
                print(str(i) + "|||||" + str(name) + " |||| " + str(m) + "|||||")
                m.register_forward_pre_hook(viz)

            i = i + 1

    # print(">>>>>>>>>>>!!!!!")
    # print(input_image.shape)
    # print(">>>>>>>>>>>!!!!!")
    with torch.no_grad():
        resnet50(input_image)

    global numOfResult
    global picData
    # print(picData[0].ndim)
    # print(len(picData))
    # print("<<<<<<<<")
    # print(picData)
    # print(">>>>>>>>")

    # testPic = Image.fromarray(picData).convert('RGB')
    # pyArray = picData[0].tolist()
    pyArray = 0

    # 这个dict里面包含用户点击的这一层拥有多少个结果 还有返回制定的图片的array 然后到前端再进行生成显示
    resultDict = {'sum': str(numOfResult), 'picData': json.dumps(pyArray)}

    return resultDict

# def convertPic():

# if __name__ == "__main__":
#     mc_Resnet50(file)
