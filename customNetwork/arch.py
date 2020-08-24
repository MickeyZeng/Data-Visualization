import torch
import torch.nn as nn
import torchvision.models as models
from torch.nn import functional as F

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

        self.target_info = target_info

        if self.target_info['network'] == 'cifar10_efficientnet':
            from cifar10.efficientnet import EfficientNetB0
            self.net = EfficientNetB0()
            in_features = 320
        elif self.target_info['network'] == 'cifar10_resnet18':
            from cifar10.resnet import ResNet18
            self.net = ResNet18()
            in_features = 512
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
            # avg_pool = modules[-2]
            if 'resnet' in self.target_info['network'] or 'resnext' in self.target_info['network']:
                modules[0] = nn.Conv2d(3, 64, kernel_size=(3, 3), stride=(1, 1), padding=(1, 1), bias=False)
                modules[3] = nn.MaxPool2d(kernel_size=3, stride=1, padding=1, ceil_mode=False)
                modules = modules[:-1]
            elif 'densenet' in self.target_info['network'] or 'vgg' in self.target_info['network'] or \
                 'mobilenet' in self.target_info['network']:
                modules = modules[:-1]

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
                c_name = s_name.split('_')[1]
                cls_maps_idx = list(self.target_info['cls_cols_dict'].keys()).index(c_name)
                s_logits = F.interpolate(cls_maps[cls_maps_idx], input.shape[2:], mode='bicubic', align_corners=True)
                seg_logits.append(s_logits)
        seg_maps = seg_logits

        return regression_logits, binary_cls_logits, cls_logits, seg_logits, \
               regression_maps, binary_cls_maps, cls_maps, seg_maps

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
                   'network': 'cifar10_resnet18',
                   'pretrained': 'True',
                   'regression_cols': [],
                   'binary_cls_cols': [],
                   'cls_cols_dict': {'text_label': 10},
                   'seg_cols_dict': {}}
    return SimpleNet(target_info)


"""
parser.add_argument('--data_path', type=str, default='dataset/cifar10/', help='the path to data')
    parser.add_argument('--batch_size', type=int, default=128)
    parser.add_argument('--val_batch_size', type=int, default=100)
    parser.add_argument('--num_workers', type=int, default=4)
    parser.add_argument('--num_epochs', type=int, default=100)
    parser.add_argument('--save_path', type=str, default='data/cifar10_official3')
    parser.add_argument('--save_interval', type=int, default=5, help='#epochs')
    parser.add_argument('--cam_interval', type=int, default=50, help='#batches')
    parser.add_argument('--display_interval', type=int, default=50, help='#batches')

    parser.add_argument('--reload_path', type=str, default='data/cifar10_official/net_e100.ckpt',
                        help='path for trained network')
    parser.add_argument('--reload_from_checkpoint', type=utils.str2bool, default='False')

    parser.add_argument('--seed', type=int, default=0)

    parser.add_argument('--learning_rate', type=float, default=1e-1)
    parser.add_argument('--optimizer', type=str, default='sgd')
    parser.add_argument('--learning_rate_end', type=float, default=1e-3)
    parser.add_argument('--lr_decay_policy', type=str, default='linear', choices=['exp', 'linear'])

    parser.add_argument('--network', type=str, default='cifar10_resnet18')
    parser.add_argument('--pretrained', type=utils.str2bool, default='True')
    parser.add_argument('--input_size', type=int, default=32)
    parser.add_argument('--crop_ratio', type=float, default=1.)

    parser.add_argument('--val_type', type=str, default='val')
    parser.add_argument('--seg_net_ver', type=int, default=-1)
    parser.add_argument('--seg_loss_ver', type=int, default=-1)

    parser.add_argument('--use_apex', type=utils.str2bool, default='False')
"""
