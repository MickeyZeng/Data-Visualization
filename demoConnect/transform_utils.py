import numpy as np
from PIL.Image import Image as pil_image_type
from PIL import Image as PIL_Image
from PIL import ImageOps as pil_ops
import cv2
import math


def image_size(image):
    if type(image) == pil_image_type:
        sz = image.size[::-1]
    elif type(image) == np.ndarray:
        sz = image.shape[:2]
    else:
        raise ValueError('Unsupported image type: {}'.format(type(image)))
    
    return sz


def random_crop(image, random_codes, crop_ratio_min=0.8, crop_ratio_max=1.):

    source_size = image_size(image)
    rand_ratio_x = random_codes[0] * (crop_ratio_max - crop_ratio_min) + crop_ratio_min
    rand_ratio_y = random_codes[1] * (crop_ratio_max - crop_ratio_min) + crop_ratio_min

    new_size_x = int(rand_ratio_x * source_size[0])
    new_size_y = int(rand_ratio_y * source_size[1])

    rand_start_x = int(random_codes[2] * (source_size[0] - new_size_x))
    rand_start_y = int(random_codes[3] * (source_size[1] - new_size_y))
    rand_end_x = rand_start_x + new_size_x
    rand_end_y = rand_start_y + new_size_y

    if type(image) == pil_image_type:
        cropped_image = image.crop((rand_start_y, rand_start_x, rand_end_y, rand_end_x))
        # print('PIL: {} -> {} using {}'.format(image.size, cropped_image.size, random_codes))
    elif type(image) == np.ndarray:
        cropped_image = image[rand_start_x:rand_end_x, rand_start_y:rand_end_y]
        # print('NP: {} -> {} using {}'.format(image.shape, cropped_image.shape, random_codes))
    return cropped_image


# pad the boarder of the short dimension to square image, image is considered as HxWxC
def border_padding(image, padding_value=0, extra_padding_pixels=0):
    source_size = image_size(image)
    max_size = max(source_size) + extra_padding_pixels * 2
    new_size = (max_size, max_size)

    start_x = int((new_size[0] - source_size[0]) / 2)
    end_x = start_x + source_size[0]

    start_y = int((new_size[1] - source_size[1]) / 2)
    end_y = start_y + source_size[1]

    if type(image) == pil_image_type:
        padded_image = PIL_Image.new("RGB", new_size, color=padding_value)
        padded_image.paste(image, (start_y, start_x))
    elif type(image) == np.ndarray:
        padded_image = np.ones(list(new_size) + [image.shape[2]], dtype=image.dtype) * padding_value
        padded_image[start_x:end_x, start_y:end_y] = image

    return padded_image


def random_horizontal_flip(image, random_code):
    if random_code >= 0.5:
        if type(image) == pil_image_type:
            flipped_image = pil_ops.mirror(image)
        elif type(image) == np.ndarray:
            flipped_image = image[:, ::-1, :]

        return flipped_image
    else:
        return image


def random_rotation(image, random_code, max_angle=30, border_value=0):
    angle = max_angle * 2 * random_code - max_angle

    if type(image) == pil_image_type:
        rotated_image = image.rotate(angle, resample=PIL_Image.BILINEAR, fillcolor=border_value)
    elif type(image) == np.ndarray:
        rotated_image = rotate_numpy_image(image, angle, border_value=border_value)

    return rotated_image


# https://stackoverflow.com/questions/9041681/opencv-python-rotate-image-by-x-degrees-around-specific-point
def rotate_numpy_image(image, angle, border_value):
    h, w = image.shape[:2]
    img_c = (w / 2, h / 2)

    rot_mat = cv2.getRotationMatrix2D(img_c, angle, 1)

    rad = math.radians(angle)
    sin = math.sin(rad)
    cos = math.cos(rad)
    b_w = int((h * abs(sin)) + (w * abs(cos)))
    b_h = int((h * abs(cos)) + (w * abs(sin)))

    rot_mat[0, 2] += ((b_w / 2) - img_c[0])
    rot_mat[1, 2] += ((b_h / 2) - img_c[1])

    rotated_image = np.ones((b_h, b_w, image.shape[2]), dtype=image.dtype) * border_value
    rotated_image = cv2.warpAffine(image, rot_mat, (b_w, b_h), rotated_image, flags=cv2.INTER_NEAREST,
                                   borderMode=cv2.BORDER_TRANSPARENT)
    return rotated_image

