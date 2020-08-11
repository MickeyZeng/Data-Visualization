# To get the json file by the path

import json


def json_to_dict(path):
    """
    :param path:
    :return:
    TODO: This is to load the json file
    """
    with open(path, 'r') as f:
        temp = json.load(f)
        # print(temp)
        return temp


def dis_index(label, flag=None):
    """
    :param label: the label name
    :return: label index
    TODO: This is to return the index of label
    """
    if flag == "True":
        temp = json_to_dict("customNetwork/label.json")
    else:
        temp = json_to_dict("ResNet50/imagenet-simple-labels.json")

    for i in range(len(temp)):
        if temp[i] == label:
            return i
    return -1


def get_length(jsonType, jsonPath):
    """
    :param jsonType: To judge the type of json is default or customize
    :param jsonPath: To load the right json
    :return: the number of results
    TODO: This function is to return the number of result according to the length of json file
    IF the length of json is bigger than 5, the function will return 5
    ELSE the length of json is smaller than 5, the function will return the length of json file
    """
    if jsonType == 0:
        return 5
    elif jsonType == 1:
        length = len(json_to_dict(jsonPath))
        if length >= 5:
            return 5
        else:
            return length
    return 0

# if __name__ == '__main__':
#     json_to_dict("imagenet-simple-labels.json")
