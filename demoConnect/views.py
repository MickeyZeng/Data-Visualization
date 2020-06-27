import json

import numpy as np
from PIL import Image
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

import ResNet50.json_to_dict as jtd
import ResNet50.test_back_end as resnet
from heatmap import guided_backprop as backprop
from heatmap import misc_functions as mics
from heatmap import scorecam as score


def testThreeDimension(request):
    """
    TODO: This is to test the tensorspace, which is to display the structure in 3D
    :param request:
    :return: Template page
    """
    return render(request, 'testThreeDimension.html')


def homepage(request):
    """
    TODO: This is the page updated the layout
    :param request:
    :return: Template page
    """
    return render(request, 'index.html')


def display(request):
    """
    TODO: This function is to display the homepage
    :param request:
    :return: Template page
    """
    # s = 'Hello World!'
    # # current_time = datetime.datetime.now()
    # html = '<html><head></head><body><h1> %s </h1><p></p></body></html>' % (s)
    return render(request, 'newFront_end.html')


@csrf_exempt
def uploadFile(request):
    """
    :TODO: This function is to process the uploaded file and save the image in the server
    :param request:
    :return: the output of resNet
    """
    # print(request.POST)
    imgData = request.POST.get('imgData')
    width = request.POST.get('width')
    height = request.POST.get('height')
    netName = request.POST.get('netName')

    picData = arrToTensor(imgData, width, height)

    # " 放入训练好的神经网络 进行训练 并返回结果 "
    resultDict = resnet.mc_Resnet(picData, netName)

    return HttpResponse(json.dumps(resultDict))


@csrf_exempt
def displayResnet(request):
    """
    :TODO: This is to get structure from the back-end (JSON type)
    :param request:
    :return: JSON type result
    """
    networkName = request.POST.get('name')
    # print(username + " this the data from font-end")
    result = resnet.outputNet(networkName)
    # print(result)
    return HttpResponse(json.dumps(result))


@csrf_exempt
def tempOutput(request):
    """
    :param request: including the number of layers and the name of file
    :return: a temp Result
    :TODO: This is to get the temp result from the back-end
    """
    num = request.POST.get('number')
    index = request.POST.get('index')
    imgData = request.POST.get('imgData')
    width = request.POST.get('width')
    height = request.POST.get('height')
    colorMap = request.POST.get('colorMap')
    netName = request.POST.get('netName')

    picData = arrToTensor(imgData, width, height)

    result = resnet.tempOutput(num, picData, index, colorMap, netName)
    finales = json.dumps(result)
    # print(">>>>>>>>>>>>>>>")
    # print(type(finales))
    # print(finales + "   <<<<<<<<")

    return HttpResponse(finales)


# TODO: This is to display the heatMap for submit image
@csrf_exempt
def disHeatMap(request):
    imgData = request.POST.get('imgData')
    width = request.POST.get('width')
    height = request.POST.get('height')
    label = request.POST.get('label')
    index = jtd.dis_index(label)

    # print("1")
    # print(time.clock())
    picData = arrToTensor(imgData, width, height)

    # Get params
    # print("2")
    # print(time.clock())
    (original_image, prep_img, target_class, file_name_to_export, pretrained_model) = \
        mics.get_example_params(picData, index)

    # For score-weighted
    imgArray = scoreCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width)
    # For Colored Guided Backpropagation
    picArray = coloredGB(original_image, prep_img, target_class, file_name_to_export, pretrained_model)

    resultList = [imgArray.tolist(), picArray.tolist()]

    return HttpResponse(json.dumps(resultList))


# TODO: This is to display the Colored Guided Backpropagation
def coloredGB(original_image, prep_img, target_class, file_name_to_export, pretrained_model):
    # Guided backprop
    GBP = backprop.GuidedBackprop(pretrained_model)

    # Get gradients
    guided_grads = GBP.generate_gradients(prep_img, target_class)

    # Save colored gradients
    # Normalize
    gradient = guided_grads - guided_grads.min()
    gradient /= gradient.max()

    if isinstance(gradient, (np.ndarray, np.generic)):
        im = mics.format_np_output(gradient)
        im = Image.fromarray(im)

    picArray = np.array(im)
    return picArray


# TODO: This is to display the Score-weighted Class Activation Heatmap on Image
def scoreCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width):
    # Score cam
    # print("3")
    # print(time.clock())
    score_cam = score.ScoreCam(pretrained_model, target_layer=11)
    # Generate cam mask
    # print("4")
    # print(time.clock())
    cam = score_cam.generate_cam(prep_img, target_class)
    # Save mask
    # save_class_activation_images(original_image, cam, file_name_to_export)
    # print("5")
    # print(time.clock())
    heatmap, heatmap_on_image = mics.apply_colormap_on_image(original_image, cam, 'magma')
    heatmap_on_image = heatmap_on_image.resize((int(width), int(width)), Image.ANTIALIAS)
    # print("6")
    # print(time.clock())
    imgArray = np.array(heatmap_on_image)
    # print("7")
    # print(time.clock())

    print('Score cam completed')

    return imgArray


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
