import matplotlib
import numpy as np
from PIL import Image

from heatmap import gradcam as gc
from heatmap import guided_backprop as backprop
from heatmap import guided_gradcam as gg
from heatmap import integrated_gradients as ig
from heatmap import misc_functions as mics
from heatmap import scorecam as score
from heatmap import vanilla_backprop as vb
from matplotlib import pyplot as plt


# TODO: This is to display Integrated Gradients
def integradePic(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width):
    # Vanilla backprop
    IG = ig.IntegratedGradients(pretrained_model)
    # Generate gradients
    integrated_grads = IG.generate_integrated_gradients(prep_img, target_class, 100)
    # Convert to grayscale
    grayscale_integrated_grads = mics.convert_to_grayscale(integrated_grads)

    picArray = save_gradient_images(grayscale_integrated_grads, width)

    return picArray


# TODO: This is to display Guided Gradient-weighted Class Activation Map
def guidedCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type, width):
    # Grad cam
    gcv2 = gc.GradCam(pretrained_model, target_layer=11)
    # Generate cam mask
    cam = gcv2.generate_cam(prep_img, target_class)
    print('Grad cam completed')

    # Guided backprop
    GBP = backprop.GuidedBackprop(pretrained_model)
    # Get gradients
    guided_grads = GBP.generate_gradients(prep_img, target_class)
    print('Guided backpropagation completed')

    # Guided Grad cam
    cam_gb = gg.guided_grad_cam(cam, guided_grads)

    if type == "colored":
        picArray = save_gradient_images(cam_gb, width)

    elif type == "gray":
        grayscale_cam_gb = mics.convert_to_grayscale(cam_gb)
        picArray = save_gradient_images(grayscale_cam_gb, width)

    return picArray


# TODO: This is to display the Grad-CAM
def gradeCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type, width):
    # Grad cam
    grad_cam = gc.GradCam(pretrained_model, target_layer=11)

    # Generate cam mask
    cam = grad_cam.generate_cam(prep_img, target_class)

    heatmap, heatmap_on_image = mics.apply_colormap_on_image(original_image, cam, 'viridis')

    if type == "gray":
        cam = save_image(cam)
        cam = cam.resize((int(width), int(width)), Image.ANTIALIAS)
        imgArray = np.array(cam)
    elif type == "colored":
        heatmap = save_image(heatmap)
        heatmap = heatmap.resize((int(width), int(width)), Image.ANTIALIAS)
        imgArray = np.array(heatmap)
    elif type == "onImage":
        heatmap_on_image = save_image(heatmap_on_image)
        heatmap_on_image = heatmap_on_image.resize((int(width), int(width)), Image.ANTIALIAS)
        imgArray = np.array(heatmap_on_image)

    print('Grad cam completed')
    return imgArray


# TODO: This is to display the Colored Guided Backpropagation
def coloredGB(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width, color, negative):
    # Guided backprop
    GBP = backprop.GuidedBackprop(pretrained_model)

    # Get gradients
    guided_grads = GBP.generate_gradients(prep_img, target_class)

    if not color:
        guided_grads = mics.convert_to_grayscale(guided_grads)

    if not negative or negative == "1" or negative == "2":
        pos_sal, neg_sal = mics.get_positive_negative_saliency(guided_grads)
        if negative == "1":
            guided_grads = pos_sal
        elif negative == "2":
            guided_grads = neg_sal

    picArray = save_gradient_images(guided_grads, width)

    return picArray


# TODO: This is to display the Score-weighted Class Activation Heatmap on Image
def scoreCAM(original_image, prep_img, target_class, file_name_to_export, pretrained_model, type, width):
    # Score cam
    score_cam = score.ScoreCam(pretrained_model, target_layer=11)
    # Generate cam mask
    cam = score_cam.generate_cam(prep_img, target_class)
    # Save mask
    heatmap, heatmap_on_image = mics.apply_colormap_on_image(original_image, cam, 'magma')

    if type == "onImage":
        heatmap_on_image = save_image(heatmap_on_image)
        heatmap_on_image = heatmap_on_image.resize((int(width), int(width)), Image.ANTIALIAS)
        imgArray = np.array(heatmap_on_image)

    elif type == "gray":
        cam = save_image(cam)
        cam = cam.resize((int(width), int(width)), Image.ANTIALIAS)
        imgArray = np.array(cam)

    elif type == "colored":
        heatmap= save_image(heatmap)
        heatmap = heatmap.resize((int(width), int(width)), Image.ANTIALIAS)
        imgArray = np.array(heatmap)

    print('Score cam completed')

    return imgArray


# TODO: This is to display the Vanilla Backpropagation Saliency
def vanillaBS(original_image, prep_img, target_class, file_name_to_export, pretrained_model, width, color):
    # Vanilla backprop
    VBP = vb.VanillaBackprop(pretrained_model)
    # Generate gradients
    vanilla_grads = VBP.generate_gradients(prep_img, target_class)

    if not color:
        vanilla_grads = mics.convert_to_grayscale(vanilla_grads)

    picArray = save_gradient_images(vanilla_grads, width)
    return picArray


# TODO: To Save colored gradients
def save_gradient_images(guided_grads, width):
    # Save colored gradients
    # Normalize
    gradient = guided_grads - guided_grads.min()
    gradient /= gradient.max()

    if isinstance(gradient, (np.ndarray, np.generic)):
        im = mics.format_np_output(gradient)
        im = Image.fromarray(im)

    im = im.resize((int(width), int(width)), Image.ANTIALIAS)
    picArray = np.array(im)

    return picArray


# TODO: Format the image with 2D array
def save_image(im):
    if isinstance(im, (np.ndarray, np.generic)):
        im = mics.format_np_output(im)
        im = Image.fromarray(im)

    return im


def plot(tensor, index):
    tensor = tensor[index]
    tensor = tensor.detach().squeeze().numpy()

    plt.imshow(tensor)
    plt.show()