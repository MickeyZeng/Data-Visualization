import torch
import torchvision.models as models
from torchvision.models.resnet import model_urls


def get_neural_network(name):
    """
    :param name: Neural Network name
    :return: The neural network instance
    TODO: IF the name is 'custom', it will be read the uploaded file, otherwise, return the pre-trained neural network
    """
    if name == 'custom':
        resnet = get_custom_network()
        return resnet

    # model_urls['resnet50'] = model_urls['resnet50'].replace('https://', 'http://')
    model_urls[name] = model_urls[name].replace('https://', 'http://')
    # resnet = models.resnet50(pretrained=True)
    if name == 'resnet50':
        resnet = models.resnet50(pretrained=True)
    elif name == 'resnet18':
        resnet = models.resnet18(pretrained=True)
    elif name == 'resnet34':
        resnet = models.resnet34(pretrained=True)
    elif name == 'resnet101':
        resnet = models.resnet101(pretrained=True)
    elif name == 'resnet152':
        resnet = models.resnet152(pretrained=True)

    return resnet


def get_custom_network():
    """
    TODO: This is to get the custom network
    :return: customize neural network
    """
    # pthPath = "customNetwork/weight.pth"
    # import customNetwork.arch as ca
    # resnet = ca.get_network()
    # resnet.load_state_dict(torch.load(pthPath, map_location=torch.device('cpu')))

    import cifar10.seg_model as cs
    resnet = cs.get_network()
    pthPath = "cifar10/net_e100_cifar10.pth"
    resnet.load_state_dict(torch.load(pthPath, map_location=torch.device('cpu')))

    return resnet
