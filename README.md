# Data visualisation for Computer Vision (Django)

## Installation

Install via pip: `pip install -Ur requirement.txt` or `pip3 install -Ur requirement.txt`

If you do NOT have `pip` or `pip3` , please use the following methods to install:
- OS X / Linux, run the following commands: 

 
    ```
    pip:
    curl http://peak.telecommunity.com/dist/ez_setup.py | python
    curl https://raw.github.com/pypa/pip/master/cogit ntrib/get-pip.py | python
    ```

 
     ```
    pip3:
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    wget https://bootstrap.pypa.io/get-pip.py
    ```

- Windows：


    Download pip: http://peak.telecommunity.com/dist/ez_setup.py and https://raw.github.com/pypa/pip/master/contrib/get-pip.py, and run with python. 
    Download pip3: https://pip.pypa.io/en/stable/installing/
    

## Run

### Getting start to run server
Execute: `./manage.py runserver`


Open up a browser and visit: http://127.0.0.1:8000/ , the you will see the Web portal.


## How to Use

### Homepage
![image](https://github.com/MickeyZeng/Data-Visualization/blob/newLayout/IMAGE/Homepage1.png)
![image](https://github.com/MickeyZeng/Data-Visualization/blob/newLayout/IMAGE/Homepage2.png)
user can upload the image or CSV file with provided format andupload the data to the server-side. The function of the upload CSV file can not onlyallow practitioner annotate a large number of pictures but also it can demonstratethe ground truth for displaying the image. When user upload folder or CSV file, thescribble tool offer two arrows button for switching picture to the previous one ornext one.

### Network Architecture page
![image](https://github.com/MickeyZeng/Data-Visualization/blob/newLayout/IMAGE/NewArchitecture1.png)
With clicking the but-ton of “Display”, the interactive visualization diagram developed by a “Javascript”diagram framework called “Visjs”3for default neural network (in general, “resnet50”is default setting)(P.S. for other setting, there might have some issues in displaying) of scribble tool will be generated and illustrated in the attentiondisplaying window.

### Custom Network page
![image](https://github.com/MickeyZeng/Data-Visualization/blob/newLayout/IMAGE/Customized1.png)
Network  architecture file must include the  function named  “get_network”,which is to initialize the network and return the instance of neural network.Moreover, the type of architecture file must be a Python file.
Network parameters file must be Python file. Also, it should match the upload architecture file. Otherwise, there are some errors in the period of processing.
Label dictionary must be JSON file. In addition, the numberof labels should be the same as the number of network result. The label of this file will be used by leader board in homepage.

## About the issues

If you have any *question*, please use Issue or send problem descriptions to my email `mickey96zeng@gmail.com`. I will reponse you as soon as possible. And, we recommend you to use Issue.
