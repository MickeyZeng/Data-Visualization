"""
This is the source for machine learning
 这个代码是为了 机器学习识别 的后台代码
"""

import json

import cv2
import numpy as np
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from matplotlib import pyplot as plt
from torchsummary import summary
from demoConnect import transform_utils as dt

import ResNet50.get_neural_network as gnn
import ResNet50.json_to_dict as jtd
import demoConnect.util as du

# matplotlib.use('agg')

numOfResult = 0
rank = 0
picData = 0
cmp = ""


def mc_Resnet(img, netName, jsonType):
    """
    :param customizeLabel:
    :param jsonType: This is to let the resnet has different dictionary to translate the result
    :param img: the data of Input image
    :param netName: The image will be processed by the type of neural network
    :return: the result in JSON
    :TODO: Process the file by resNet
    """
    # This is for applying different nets to process image
    # resnet = torch.hub.load('pytorch/vision:v0.6.0', netName, pretrained=True)
    # resnet = models.resnet50(pretrained=True)
    # resnet50.load_state_dict(torch.load('resnet152.pth'))

    resnet = gnn.get_neural_network(netName)

    # The custom neural network has no attribute for eval
    # if netName != 'custom':
    resnet.eval()

    # print(">>>>> HERE?? >>>>>>")

    input_image = preProcessImg(img)
    input_image = input_image.unsqueeze(0)

    # with torch.no_grad():
    outputs = resnet(input_image)
    # outputs[1][0] = outputs[1][0].softmax(dim=1)
    # Save the input image
    source_image = torch.tensor(np.expand_dims(
        np.swapaxes(np.swapaxes(img, 2, 1), 1, 0), axis=0))

    # outputs有时候会有两个tensor的结果 一个为最后的分类结果 一个是attention map
    resultCAM = []
    picCAM = []
    if len(outputs) == 2:
        attentionMap = outputs[1][0]
        # attentionMap = torch.softmax(attentionMap[0], dim=1)
        # attentionMap = attentionMap[0].max(dim=1, keepdim=True)[0].repeat(1,10,1,1)
        max_value = attentionMap.detach().numpy().max()
        min_value = attentionMap.detach().numpy().min()

        test = augment_images(source_image, attentionMap, max_value, min_value)
        # test = augment_images(source_image, attentionMap[0])
        for index in range(len(test)):
            resultCAM.append(np.array(test[index]).tolist())
        outputs = outputs[0][0]
        outputs = torch.softmax(outputs, dim=1)
        outputs = du.transfer_rate(outputs)
    else:
        outputs = nn.Softmax(dim=1)(outputs)

    outputs = outputs.squeeze()
    # Got the json file by the path 0 => default JSON ; 1 => custom JSON
    if jsonType == 0:
        jsonPath = "ResNet50/imagenet-simple-labels.json"
    elif jsonType == 1:
        jsonPath = "customNetwork/label.json"
        # jsonPath = "customNetwork/label.json"
    else:
        return False

    outputs_numpy = outputs.detach().numpy()

    # This is to get the right number of results
    top_k = min(jtd.get_length(jsonType, jsonPath), outputs_numpy.size)

    top_k = top_k * (-1)

    top_k_idx = outputs_numpy.argsort()[top_k:][::-1]
    print(top_k_idx)

    # 控制在三位
    outputs_numpy = np.around(outputs_numpy, 3)
    dictionary = jtd.json_to_dict(jsonPath)
    result = []
    resultRate = []

    # for i in range(top_k_idx):
    #     resultRate.append(outputs_numpy[i])

    for i in range((top_k * (-1))):
        # 因为Json的是从1开始的 所以需要-1
        result.append(dictionary[top_k_idx[i]])
        picCAM.append(resultCAM[top_k_idx[i]])

    if outputs_numpy.size == 1:
        if outputs_numpy > 0.5:
            result.clear()
            result.append(dictionary[1])
            resultRate.append(str(outputs_numpy))
        else:
            resultRate.append(str(1 - outputs_numpy))
    else:
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

    return resultDict, picCAM


def displayNet():
    """
    :TODO: display details by function of summary
    :return:
    """
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    stuResnet = models.resnet50().eval().to(device)

    return summary(stuResnet, (3, 244, 244))


def outputNet(netName):
    """
    :TODO: 会以Dictionary中 保存默认resnet50结构, save the data in JSON 会根据prama显示相关网络的结构
    :return: a dictionary for the structure of resnet
    """

    # 用一个字典去存数据 以方便json返回去前端 再加一个为了dic的index
    dictNet = {}
    dicIndex = 0
    # 暂存一个最大的list
    res = []
    # 层数的index
    index = 0
    # 这个是给第一层写的
    tempLayers1 = []
    # 这个是给第二层写的
    tempLayers2 = []
    # 这个有第三层
    tempLayers3 = []

    # 这个函数只做打印
    # resnet = models.resnet50(pretrained=True)
    resnet = gnn.get_neural_network(netName)
    # This sentence can let you have right label in final
    resnet.eval()

    resultString = resnet.__str__()
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

        # 这一堆代码原始显示 Feature map
        # 这句话让图片在后台显示出来
        fig = plt.imshow(picData)
        plt.axis('off')
        # r = plt.gcf().canvas.get_renderer()
        cmp.strip()
        print(cmp)
        cm = plt.get_cmap(cmp)
        # cm = plt.get_cmap('viridis')
        colored_image = cm(picData)
        picData = Image.fromarray(
            (colored_image[:, :, :3] * 255).astype(np.uint8))
        picData = picData.resize((400, 400), Image.ANTIALIAS)
        picData = np.array(picData)
        # picData = fig.make_image(r)

        # picData = DIYColormap(picData)
        # # plt.imshow(tempPicData)
        # # plt.show()
        # picData = (picData * 255).astype(np.uint8)
        # picData = Image.fromarray(picData.astype('uint8'), 'RGB')
        # picData = picData.resize((400, 400), Image.ANTIALIAS)


# def DIYColormap(array):
#     array = np.sin(array) * 1000
#     index = array % 255
#
#     res = np.zeros((len(index), len(index[0]), 3))
#     for i in range(len(index)):
#         for j in range(len(index[i])):
#             res[i][j][0] = cm._viridis_data[int(index[i][j])][0]
#             res[i][j][1] = cm._viridis_data[int(index[i][j])][1]
#             res[i][j][2] = cm._viridis_data[int(index[i][j])][2]
#
#     return res

def tempOutput(num, img, index, colorMap, netName):
    """
    :TODO: 这个函数是为了获取任意一层的输出
    :param netName:
    :param colorMap:
    :param index:
    :param img:
    :param num:
    :param name:
    :return: 返回总共有多少张图 可以查询
    """
    global rank
    rank = index

    global cmp
    cmp = colorMap

    input_image = preProcessImg(img)
    input_image = input_image.unsqueeze(dim=0)

    # 这个是来计算应该在用户点击的那一层放上输出标记
    i = 0

    # Create an neural network
    # resNet = models.resnet50(pretrained=True)
    print(netName)
    resnet = gnn.get_neural_network(netName)
    resnet.eval()

    # Input output the result of certain layers
    for name, m in resnet.named_modules():
        if isinstance(m, torch.nn.Conv2d) or isinstance(m, torch.nn.MaxPool2d) \
                or isinstance(m, torch.nn.AdaptiveAvgPool2d) or isinstance(m, torch.nn.Linear) \
                or isinstance(m, torch.nn.ReLU):

            if int(num) == int(i):
                print(str(i) + "|||||" + str(name) +
                      " |||| " + str(m) + "|||||")
                m.register_forward_pre_hook(viz)

            i = i + 1

    # print(">>>>>>>>>>>!!!!!")
    # print(input_image.shape)
    # print(">>>>>>>>>>>!!!!!")
    with torch.no_grad():
        resnet(input_image)

    global numOfResult
    global picData
    # print(picData[0].ndim)
    # print(len(picData))
    # print("<<<<<<<<")
    # print(picData)
    # print(">>>>>>>>")

    # testPic = Image.fromarray(picData).convert('RGB')
    # pyArray = picData[0].tolist()
    picData = np.array(picData).tolist()

    # 这个dict里面包含用户点击的这一层拥有多少个结果 还有返回制定的图片的array 然后到前端再进行生成显示
    resultDict = {'sum': str(numOfResult), 'picData': json.dumps(picData)}

    return resultDict


# TODO: This is to process img to be a legal size
def preProcessImg(img):
    pic = Image.fromarray(img.astype('uint8'), 'RGB')
    # pic = pic.resize((224, 224), Image.ANTIALIAS).rotate(270)
    pic = pic.rotate(270)
    pic = pic.transpose(Image.FLIP_LEFT_RIGHT)
    # plt.imshow(pic)
    # plt.show()

    # normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406],
    #                                  std=[0.229, 0.224, 0.225])
    # t = transforms.Compose([
    #     transforms.Resize(256),
    #     transforms.CenterCrop(224),
    #     transforms.ToTensor(),
    #     normalize,
    # ])

    # normalize = transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
    # pic = np.load("/Users/mickey/document/Master of computer science/Project/cifar10/data.npy")[18551]
    # pic = Image.fromarray(pic, 'RGB')

    t = transforms.Compose([
        transforms.Resize(32, interpolation=Image.NEAREST),
        # transforms.Resize(224, interpolation=Image.BICUBIC),
        # transforms.CenterCrop(32),
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
    ])

    # pic = Image.open("/Users/mickey/Downloads/image_data/images/2890672.jpg")
    # pic = pic.convert('RGB')
    # pic = dt.border_padding(pic)
    # t = transforms.Compose([
    #     transforms.Resize((256, 256)),
    #     transforms.ToTensor(),
    #     transforms.Normalize((0.485, 0.456, 0.406),
    #                          (0.229, 0.224, 0.225)),
    #     # T.RandomErasing(p=0.5, scale=(0.02, 0.33), ratio=(0.3, 3.3), value=0, inplace=False),
    # ])

    input_image = t(pic)

    return input_image


def augment_images(source_images, cams, max_value, min_value):
    augmented_images = list()
    resultCAM = list()


    for im_idx, sim in enumerate(source_images):
        # the image
        sim = sim.numpy()
        sim = np.moveaxis(sim, (0, 1, 2), (2, 0, 1))

        # attention map
        att_maps = cams[im_idx].detach().cpu().numpy()
        # min_value = 0 # np.min(att_maps)
        # max_value = np.max(att_maps)

        # Mickey: 我手动改了min -> max了
        for l in range(max(att_maps.shape[0], 10)):
            att_map = att_maps[l]
            att_map = cv2.resize(
                att_map, source_images.shape[2:], interpolation=cv2.INTER_CUBIC)

            # att_map =∂ np.clip(att_map, 0, 1)
            # 用了Global Max后 这里不需要重新计算
            # min_value = np.min(
            #     np.min(att_map, axis=0, keepdims=True), axis=1, keepdims=True)
            # max_value = np.max(
            #     np.max(att_map, axis=0, keepdims=True), axis=1, keepdims=True)
            att_map = (att_map - min_value) / (max_value - min_value)

            att_map = att_map.clip(0,1)

            # # text to display
            # l = labels[im_idx].item()
            # p = preds[im_idx].item()
            # disp_str = 'L{}P{}'.format(int(l) if l.is_integer() else '{:0.3f}'.format(l),
            #                            int(p) if p.is_integer() else '{:0.3f}'.format(p))

            # to uint8
            sim_uint8 = (sim * 255).astype(np.uint8)
            att_map_uint8 = (att_map * 255).astype(np.uint8)
            att_map_uint8 = cv2.applyColorMap(att_map_uint8, cv2.COLORMAP_JET)
            augmented = att_map_uint8
            # augmented = cv2.addWeighted(
            #     sim_uint8, 1.0, att_map_uint8, 0.5, 0.0)
            # utils.plot_image(augmented)

            # if labels[im_idx] == preds[im_idx]:
            #     text_color = (0, 255, 63)
            # else:
            #     text_color = (0, 63, 255)
            # augmented = cv2.putText(augmented, disp_str, (10, 30),
            #                         cv2.FONT_HERSHEY_SIMPLEX, 1,
            #                         text_color, 2, cv2.LINE_AA)

            augmented = np.moveaxis(augmented, (0, 1, 2), (1, 2, 0))
            augmented = augmented[[2, 1, 0], :, :] / 255.
            augmented_images.append(torch.tensor(augmented))

            im_toshow = np.swapaxes(np.swapaxes(
                augmented_images[l].detach().numpy(), 0, 1), 1, 2)
            testImage = Image.fromarray((im_toshow * 255).astype(np.uint8))
            # testImage = testImage.rotate(-90).transpose(Image.FLIP_LEFT_RIGHT)
            resultCAM.append(testImage)
    return resultCAM


def reverseDim(array):
    testArray = np.swapaxes(array, 0, 1)
    testArray = np.swapaxes(testArray, 1, 2)
    return testArray

# if __name__ == "__main__":
#     mc_Resnet50(file)
