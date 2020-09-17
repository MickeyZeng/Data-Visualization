import torch
import torch.nn as nn
import torchvision.models as models
from torch.nn import functional as F

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
# from utils import plot


class Flatten(nn.Module):

    def __init__(self):
        super(Flatten, self).__init__()

    def forward(self, x):
        x = x.view(x.size()[0], -1)
        return x


class Flatten2(nn.Module):

    def __init__(self):
        super(Flatten2, self).__init__()

    def forward(self, x):
        x = x.view(x.size()[0], x.size()[1], -1)
        return x


class Scale(nn.Module):

    def __init__(self, scale=30):
        super(Scale, self).__init__()
        self.scale = scale

    def forward(self, x):
        return x * self.scale


class SegNet(nn.Module):

    def loss_func(self, logits, targets):
        return - (targets * torch.log_softmax(logits, dim=1)).sum(dim=1).mean()

    def __init__(self, target_info):
        super(SegNet, self).__init__()

        self.target_info = target_info

        if self.target_info['network'] == 'cifar10_efficientnet':
            from cifar10.efficientnet import EfficientNetB0
            self.net = EfficientNetB0()
            in_features = 320
        elif self.target_info['network'] == 'cifar10_resnet18':
            from cifar10.resnet import ResNet18
            self.net = ResNet18()
            in_features = 256
        elif self.target_info['network'] == 'cifar10_resnet10':
            from cifar10.resnet import ResNet18
            self.net = ResNet18()
            in_features = 128
        else:
            net = getattr(models, self.target_info['network'])(pretrained=self.target_info['pretrained'])
            if 'resnext' in self.target_info['network'] or 'resnet' in self.target_info['network']:
                in_features = list(net.fc.modules())[-1].in_features
            elif 'vgg' in self.target_info['network']:
                in_features = 512
            else:
                in_features = list(net.classifier.modules())[-1].in_features
            print(net)

            modules = list(net.children())
            modules = modules[:-2]

            self.net = nn.Sequential(*modules)

        # regression module
        modules = list()
        modules.append(nn.AdaptiveAvgPool2d(output_size=(1, 1)))
        modules.append(Flatten())
        modules.append(nn.Linear(in_features, len(self.target_info['regression_cols'])))
        self.regressor = nn.Sequential(*modules)

        # binary classification module
        modules = list()
        modules.append(nn.AdaptiveAvgPool2d(output_size=(1, 1)))
        modules.append(Flatten())
        modules.append(nn.Linear(in_features, len(self.target_info['binary_cls_cols'])))
        self.binary_classifier = nn.Sequential(*modules)

        # classification module
        self.classifiers = dict()
        for t_name in self.target_info['cls_cols_dict']:
            modules = list()
            modules.append(nn.AdaptiveAvgPool2d(output_size=(1, 1)))
            modules.append(Flatten())
            modules.append(nn.Linear(in_features, self.target_info['cls_cols_dict'][t_name]))
            classifier = nn.Sequential(*modules)
            self.add_module(t_name, classifier)
            self.classifiers[t_name] = classifier

        self.gen_cam_map = self.target_info['gen_cam_map']

    def forward(self, input):
        features = self.net(input)

        regression_logits = self.regressor(features)
        binary_cls_logits = self.binary_classifier(features)
        cls_logits = list()
        for c_name in self.classifiers:
            classifier = self.classifiers[c_name]
            cls_logits.append(classifier(features))

        regression_maps = self.get_cam_fast(features, self.regressor)
        binary_cls_maps = self.get_cam_fast(features, self.binary_classifier)
        cls_maps = list()
        for c_name in self.classifiers:
            if c_name in self.target_info['cls_cols_dict']:
                if self.target_info['cls_cols_dict'][c_name] < 100:
                    cls_maps.append(self.get_cam_fast(features, self.classifiers[c_name]))

        seg_logits = list()
        if len(self.target_info['seg_cols_dict']) != 0:
            for s_name in self.target_info['seg_cols_dict']:
                # c_name = s_name.split('_')[1]
                cls_maps_idx = list(self.target_info['cls_cols_dict'].keys()).index(c_name)
                c_map = cls_maps[cls_maps_idx]
                # c_map = c_map - c_map.reshape(c_map.shape[0], -1).mean(dim=1).view(c_map.shape[0], 1, 1, 1)
                s_logits = F.interpolate(c_map, input.shape[2:], mode='bicubic', align_corners=True)
                seg_logits.append(s_logits)
        seg_maps = seg_logits
        #
        # return regression_logits, binary_cls_logits, cls_logits, seg_logits, \
        #        regression_maps, binary_cls_maps, cls_maps, seg_maps
        return cls_logits, cls_maps


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

        if not self.gen_cam_map:
            return None

        cls_weights = classifier[-1].weight
        cls_bias = classifier[-1].bias

        cls_weights = cls_weights.permute(1, 0)
        cls_weights = cls_weights.view(1, cls_weights.shape[0], 1, 1, cls_weights.shape[1])
        act_maps = (features.view(list(features.shape)+[1]) * cls_weights).sum(dim=1)
        act_maps = act_maps.permute(0, 3, 1, 2) + cls_bias.view(1, -1, 1, 1)

        return act_maps


def get_network():
    target_info = {'gen_cam_map': 50,
                   'seg_net_ver': -1,
                   'seg_loss_ver': -1,
                   'network': 'resnet50',
                   'pretrained': 'True',
                   'regression_cols': [],
                   'binary_cls_cols': [],
                   'cls_cols_dict': {'text_label': 5},
                   'seg_cols_dict': {}}
    return SegNet(target_info)
