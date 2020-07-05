import json

from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

import ResNet50.json_to_dict as jtd
import ResNet50.test_back_end as resnet
from heatmap import heatmap_util as util
from heatmap import misc_functions as mics
from demoConnect import util


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

    picData = util.arrToTensor(imgData, width, height)

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

    picData = util.arrToTensor(imgData, width, height)

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

    heatType = request.POST.get('type')

    picData = util.arrToTensor(imgData, width, height)

    (original_image, prep_img, target_class, file_name_to_export, pretrained_model) = \
        mics.get_example_params(picData, index)

    if heatType == "1":
        # For Vanilla Backpropagation Saliency
        color = True
        heatArray = util.vanillaBS(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width,
                                   color)

    elif heatType == "2":
        # For Vanilla Backpropagation Saliency
        color = False
        heatArray = util.vanillaBS(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width,
                                   color)

    elif heatType == "3":
        # For Colored Guided Backpropagation
        color = True
        negative = False
        heatArray = util.coloredGB(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width,
                                   color, negative)

    elif heatType == "4":
        # For Guided Backpropagation Saliency (No Colored)
        color = False
        negative = False
        heatArray = util.coloredGB(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width,
                                   color, negative)

    elif heatType == "5":
        # For Guided Backpropagation Negative Saliency
        color = True
        negative = "2"
        heatArray = util.coloredGB(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width,
                                   color, negative)

    elif heatType == "6":
        # For Guided Backpropagation Positive Saliency
        color = True
        negative = "1"
        heatArray = util.coloredGB(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width,
                                   color, negative)

    elif heatType == "7":
        # For Gradient-weighted Class Activation Map (Activation Map)
        type = "gray"
        heatArray = util.gradeCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                  width)

    elif heatType == "8":
        type = "colored"
        heatArray = util.gradeCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                  width)

    elif heatType == "9":
        type = "onImage"
        heatArray = util.gradeCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                  width)

    elif heatType == "10":
        type = "gray"
        heatArray = util.scoreCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                  width)

    elif heatType == "11":
        type = "colored"
        heatArray = util.scoreCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                  width)

    elif heatType == "12":
        # For score-weighted
        type = "onImage"
        heatArray = util.scoreCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                  width)

    elif heatType == "13":
        type = "colored"
        heatArray = util.guidedCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                   width)

    elif heatType == "14":
        type = "gray"
        heatArray = util.guidedCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                   width)

    elif heatType == "15":
        heatArray = util.integradePic(original_image, prep_img, target_class, file_name_to_export, pretrained_model,
                                      width)

    resultList = [heatArray.tolist()]

    return HttpResponse(json.dumps(resultList))



