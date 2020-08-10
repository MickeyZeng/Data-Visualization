import torch
import torch.nn as nn
import torchvision.models as models

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


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


class SimpleNet(nn.Module):

    def loss_func(self, logits, targets):
        return - (targets * torch.log_softmax(logits, dim=1)).sum(dim=1).mean()

    def __init__(self, target_info):
        super(SimpleNet, self).__init__()

        # self.net = models.segmentation.fcn_resnet50(num_classes=2)
        net = getattr(models, target_info['network'])(pretrained=target_info['pretrained'])
        if 'resnext' in target_info['network'] or 'resnet' in target_info['network']:
            in_features = list(net.fc.modules())[-1].in_features
        elif 'vgg' in target_info['network']:
            in_features = 512
        else:
            in_features = list(net.classifier.modules())[-1].in_features
        print(net)
        self.target_info = target_info

        modules = list(net.children())
        # avg_pool = modules[-2]
        if 'resnet' in target_info['network'] or 'resnext' in target_info['network']:
            modules = modules[:-2]
        elif 'densenet' in target_info['network'] or 'vgg' in target_info['network'] or \
                'mobilenet' in target_info['network']:
            modules = modules[:-1]

        self.net = nn.Sequential(*modules)

        modules = list()
        modules.append(nn.AdaptiveAvgPool2d(output_size=(1, 1)))
        modules.append(Flatten())
        modules.append(nn.Linear(in_features, len(target_info['regression_cols'])))
        self.regressor = nn.Sequential(*modules)

        modules = list()
        modules.append(nn.AdaptiveAvgPool2d(output_size=(1, 1)))
        modules.append(Flatten())
        modules.append(nn.Linear(in_features, len(target_info['binary_cls_cols'])))
        self.binary_classifier = nn.Sequential(*modules)

        self.classifiers = dict()
        for t_name in target_info['cls_cols_dict']:
            modules = list()
            modules.append(nn.AdaptiveAvgPool2d(output_size=(1, 1)))
            modules.append(Flatten())
            modules.append(nn.Linear(in_features, target_info['cls_cols_dict'][t_name]))
            classifier = nn.Sequential(*modules)
            self.add_module(t_name, classifier)
            self.classifiers[t_name] = classifier

        self.avg_pool = nn.AdaptiveAvgPool2d(output_size=(1, 1))
        self.max_pool = nn.AdaptiveMaxPool2d(output_size=(1, 1))

        self.pred_func = nn.Softmax(dim=1)

        self.gen_cam_map = target_info['gen_cam_map']

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

        # return regression_logits, binary_cls_logits, cls_logits, regression_maps, binary_cls_maps, cls_maps
        return binary_cls_logits, binary_cls_maps

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
        act_maps = (features.view(list(features.shape) + [1]) * cls_weights).sum(dim=1)
        act_maps = act_maps.permute(0, 3, 1, 2) + cls_bias.view(1, -1, 1, 1)

        return act_maps


def get_network():
    target_info = {'gen_cam_map': 1,
                   'network': 'resnet50',
                   'pretrained': True,
                   'regression_cols': [],
                   'binary_cls_cols': [
                       'label'
                   ],
                   'cls_cols_dict': {}}
    return SimpleNet(target_info)
