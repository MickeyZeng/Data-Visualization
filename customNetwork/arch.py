import torch
import torch.nn as nn
import torchvision.models as models

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


class Flatten(nn.Module):
    def forward(self, x):
        x = x.view(x.size()[0], -1)
        return x


class SimpleNet(nn.Module):

    def __init__(self, output_size):
        super(SimpleNet, self).__init__()

        modules = list(models.resnet50(pretrained=True).children())
        avg_pool = modules[-2]
        max_pool = nn.AdaptiveMaxPool2d(output_size=(1, 1))
        modules = modules[:-2]
        self.net = nn.Sequential(*modules)

        modules = list()
        modules.append(avg_pool)
        modules.append(Flatten())
        modules.append(nn.Linear(2048, output_size))
        self.classifier = nn.Sequential(*modules)

        self.loss_func = nn.CrossEntropyLoss()  # weight=torch.tensor([3.88235294, 0.57391304]).to(device))
        self.pred_func = nn.Sigmoid()

    def forward(self, input):

        with torch.no_grad():
            features = self.net(input)

        cams = self.get_cam(features)

        output = self.classifier(features)
        num_classes = output.shape[1]
        cams = \
            cams - torch.log(torch.exp(output).sum(dim=1, keepdim=True) / num_classes).view(-1, 1, 1, 1)
        cams = nn.functional.relu(cams)
        return output, cams

    def loss(self, logits, targets):
        return self.loss_func(logits, targets)

    def prob(self, logits):
        return self.pred_func(logits)

    def pred(self, logits):
        return logits.detach().max(dim=1)[1]

    def correct(self, logits, targets):
        pred = self.pred(logits)
        return (pred == targets).sum().item()

    def get_cam(self, features):
        cls_weights = self.classifier[-1].weight
        cls_bias = self.classifier[-1].bias

        act_maps = list()
        for i in range(cls_weights.shape[0]):
            act_maps.append((features * cls_weights[i].view(1, -1, 1, 1)).sum(dim=1, keepdim=True)
                            + cls_bias[i].view(1, -1, 1, 1))
        return torch.cat(act_maps, dim=1)

    def get_cam_fast(self, features, classifier):
        cls_weights = classifier[-1].weight
        cls_bias = classifier[-1].bias

        cls_weights = cls_weights.permute(1, 0)
        cls_weights = cls_weights.view(1, cls_weights.shape[0], 1, 1, cls_weights.shape[1])
        act_maps = (features.view(list(features.shape) + [1]) * cls_weights).sum(dim=1)
        act_maps = act_maps.permute(0, 3, 1, 2) + cls_bias.view(1, -1, 1, 1)

        return act_maps

def get_network():
    output_size = 2
    return SimpleNet(output_size)
