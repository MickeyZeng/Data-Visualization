import torchvision.models as models
from torchvision.models.resnet import model_urls


def get_neural_network(name):

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
