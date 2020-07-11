import json

from django.http import FileResponse
from django.http import HttpResponse, Http404
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

import ResNet50.json_to_dict as jtd
import ResNet50.test_back_end as resnet
from demoConnect import util
from heatmap import heatmap_util as heatUtil
from heatmap import misc_functions as mics


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
        heatArray = heatUtil.vanillaBS(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width,
                                   color)

    elif heatType == "2":
        # For Vanilla Backpropagation Saliency
        color = False
        heatArray = heatUtil.vanillaBS(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width,
                                   color)

    elif heatType == "3":
        # For Colored Guided Backpropagation
        color = True
        negative = False
        heatArray = heatUtil.coloredGB(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width,
                                   color, negative)

    elif heatType == "4":
        # For Guided Backpropagation Saliency (No Colored)
        color = False
        negative = False
        heatArray = heatUtil.coloredGB(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width,
                                   color, negative)

    elif heatType == "5":
        # For Guided Backpropagation Negative Saliency
        color = True
        negative = "2"
        heatArray = heatUtil.coloredGB(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width,
                                   color, negative)

    elif heatType == "6":
        # For Guided Backpropagation Positive Saliency
        color = True
        negative = "1"
        heatArray = heatUtil.coloredGB(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width,
                                   color, negative)

    elif heatType == "7":
        # For Gradient-weighted Class Activation Map (Activation Map)
        type = "gray"
        heatArray = heatUtil.gradeCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                  width)

    elif heatType == "8":
        type = "colored"
        heatArray = heatUtil.gradeCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                  width)

    elif heatType == "9":
        type = "onImage"
        heatArray = heatUtil.gradeCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                  width)

    elif heatType == "10":
        type = "gray"
        heatArray = heatUtil.scoreCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                  width)

    elif heatType == "11":
        type = "colored"
        heatArray = heatUtil.scoreCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                  width)

    elif heatType == "12":
        # For score-weighted
        type = "onImage"
        heatArray = heatUtil.scoreCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                  width)

    elif heatType == "13":
        type = "colored"
        heatArray = heatUtil.guidedCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                   width)

    elif heatType == "14":
        type = "gray"
        heatArray = heatUtil.guidedCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type,
                                   width)

    elif heatType == "15":
        heatArray = heatUtil.integradePic(original_image, prep_img, target_class, file_name_to_export, pretrained_model,
                                      width)

    resultList = [heatArray.tolist()]

    return HttpResponse(json.dumps(resultList))


# TODO: This is to read the CSV file
@csrf_exempt
def readCSV(request):
    CSVFile = request.FILES['csvFile']

    result = util.readFile(CSVFile)

    return HttpResponse(json.dumps(result))


# TODO: This is to process the Scribble file and save the points in a file
@csrf_exempt
def saveScribble(request):
    """
    Get The data from front-End
    """

    # This is for the original Image size (Including height and width)
    originalImageHeight = int(request.POST.get('originalImageHeight'))
    originalImageWidth = int(request.POST.get('originalImageWidth'))

    # This is for the File name
    fileName = request.POST.get('fileName')

    # This is for positive pens(这个是给 positive 用的)
    positivePointPositioin = json.loads(request.POST.get('positivePointPositioin'))

    # This is for negative Pens(这个是给 negative 用的)
    negativePointPostition = json.loads(request.POST.get('negativePointPosition'))

    # This is for the size of drawing panel
    drawingPanelWidth = int(request.POST.get('drawingPanelWidth'))

    # This is for the class of image
    classLabel = request.POST.get('classLabel')

    # This is for the data of image
    imgData = request.POST.get('imgData')

    imgData = util.arrToTensor(imgData, drawingPanelWidth, drawingPanelWidth)

    """
    Process The data for 
    positive 
    &&&&&&&&
    negative
    """
    positiveResult = util.processScribble(originalImageHeight, originalImageWidth, fileName, positivePointPositioin,
                                          drawingPanelWidth, imgData, classLabel)

    negativeResult = util.processScribble(originalImageHeight, originalImageWidth, fileName, negativePointPostition,
                                          drawingPanelWidth, imgData, classLabel)

    """
    Return a file to front-end
    返回一个文件类型给前端进行下载
    """
    if positiveResult and negativeResult:
        file_path = 'downloadFile/' + fileName + '.json'
        try:
            """
            This function has to return BLOB(file) style
            这里一定要返回的是文件类型
            """
            f = open(file_path, 'rb')
            response = FileResponse(f)
            response['Content-Type'] = 'application/octet-stream'  # 设置头信息，告诉浏览器这是个文件
            response['Content-Disposition'] = 'attachment;filename=' + fileName + '.json'
            return response
        except Exception:
            raise Http404

    raise Http404
