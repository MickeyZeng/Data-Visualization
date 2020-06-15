# To get the json file by the path

import json


def json_to_dict(path):
    with open(path, 'r') as f:
        temp = json.load(f)
        # print(temp)
        return temp


def dis_index(label):
    temp = json_to_dict("ResNet50/imagenet-simple-labels.json")
    for i in range(len(temp)):
        if temp[i] == label:
            return i
    return -1
# if __name__ == '__main__':
#     json_to_dict("imagenet-simple-labels.json")
