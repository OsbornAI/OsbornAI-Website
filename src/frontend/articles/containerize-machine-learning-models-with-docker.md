---
title: How to containerize machine learning models using Docker
description: This article servers as an introduction to containerization, what it is, and why it's useful. It also explains what Docker is, and then provides an example of how a Python, TensorFlow, and Flask REST API can be containerized using Docker.
date_published: 20/02/2021
keywords: containerize, containers, portable, tensorflow, flask, python, rest, api, docker, how to containerize an application, model, iris dataset, gpu, gunicorn, insomnia, CORS, server, post, app
img: https://images.pexels.com/photos/1427107/pexels-photo-1427107.jpeg?auto=compress&cs=tinysrgb&h=750&w=1260
img_alt: Aerial View Photography of Container Van Lot

author: OsbornAI
author_social: https://twitter.com/BenOsbornAI
twitter: BenOsbornAI
---

### Introduction:

Imagine if you were able to take your entire machine learning project, and bundle it up with all the dependencies it requires to run into one nice little package that could be run on any PC without hassle? But surely that sounds way too good to be true, right? Wrong! Containerizing applications has become extremely popular within recent years with no exception to the big data, machine learning and deep learning industry, which take advantage of this new technology to its fullest potential.

<br />

In this article you're going to learn what containerization is and why you should use it, what Docker is, and be provided with an example of how you can containerize a TensorFlow and Flask REST API using Docker.

<br />

### What is containerization and why it is useful:

As stated earlier, containerization is essentially the process of bundling together a project and its environment into a neat little container which can then be deployed on any computer to run exactly as we specify.

<br />

A container is essentially a miniature virtual machine that contains all of the code and tools required to run your application. Ok, but why is that useful? Containers provide a simple way of sharing code with others without the need for them to set up their environment to run that code, which will make your project portable. This means that your code can now be run on almost any computer in the world without the need to set up the runtime environment first.

<br />

Lets say that you're working on a machine learning based application for a client using Python 3.8 and TensorFlow 2.0. You finish the application, and explain to your client that the application is finished and ready for them to use, and inform them that they will need to install Python 3.8 and TensorFlow 2.0 on the server of which they intend to run the project, which they say they already have installed. Two hours later you get a phone call saying that their team has been encountering an error when trying to run your application. You spend the next four hours working with them, before finding out that they were actually using Python 3.6, which did not support some features that the intended version of Python 3.8 did. You've fixed the problem, but now this mistake has wasted both parties time, given you a large headache and worst of all it has damaged your reputation. If only there was something you could of done to prevent this...

<br />

Now let's say you created a container that contained the code for the model with the correct versions and requirements of Python and TensorFlow already installed. You give the container to your client, they run it and it works first time without wasting your time, causing you frustration, and damaging your reputation!

<br />

### What is Docker:

Docker is an application that allows you to build, run and share containers, and makes containerizing your applications a straightforward process. In Docker, you containerize your applications by building a Docker image (a container). A Docker image usually consists of first declaring a base image to build upon, which is usually a base Operating System (Typically Linux) or an existing runtime environment for you to run your code on. After that, you declare what files to include in the image, as well as any dependencies the project might need, as well as specifying how the container should go about executing your code. Once a container has been built, it can be run, which will start your application. You can also share your container around, allowing other people to run your code on their computers without needing to mess around installing dependencies.

<br />

### How to containerize an application using Docker:

Now that we know what containerization is and why we should use it, and have an understanding of Docker, let's containerize a TensorFlow and Flask REST API using Docker.

<br />

#### Building the model:

First, let's create a basic TensorFlow model. This model will be trained on the Iris dataset and will be be able to determine which category of flower each set of features belongs to (Setosa, Versicolor, Virginica).

<br />

In a new file <i>model.py</i> in the <i>root</i> directory we'll first import our dependencies for this file, then declare our current working directory and set the random seed for NumPy and TensorFlow. Next we'll load the features and labels from the Iris dataset, then concatenate our features and labels so that we can shuffle our data while keeping them paired together. We will then split our data into a training and validation set. 80% of the data will be used for the training set, and the remaining 20% will make up the validation set. The code for this section can be found below.

<br />

```python
import tensorflow as tf
import numpy as np
import pickle
from sklearn.datasets import load_iris
import os

BASE_PATH = os.getcwd() # Set the current directory
SEED = 1234 # Set the random seed for reproducability

np.random.seed(SEED) # Set the numpy seed
tf.random.set_seed(SEED) # Set the tensorflow seed

X, Y = load_iris(return_X_y=True) # Load the features and labels from the iris dataset

data = np.concatenate((X, Y.reshape(-1, 1)), axis=1) # Concatenate the labels to the features
np.random.shuffle(data) # Shuffle the new data

split_size = int(0.8 * Y.size) # Specify the size of training pairs (80% of the data)
X_train = data[:split_size, :4] # Create the training features
Y_train = data[:split_size, 4:] # Create the training labels
X_valid = data[split_size:, :4] # Create the validation features
Y_valid = data[split_size:, 4:] # Create the validation labels
```

<br />

In the same file <i>model.py</i> we will then standardize our data to increase the performance of the model. We will do this by getting the mean and standard deviation of our TRAINING SET ONLY. It is important that you do not take into consideration the validation data when calculating the mean and standard deviation, or you will end up with data leakage. Next we will save our calculated mean and standard deviation to a pickle file, as we will use these calculated values when making the predictions for our features. We will then standardize both our training and validation sets. The code for this section can be found below.

<br />

```python
train_mean = X_train.mean(axis=0) # Get the mean of the training features
train_std = X_train.std(axis=0) # Get the standard deviation of the training features

standardize = {'mean': train_mean, 'std': train_std} # Create a dictionary to store the mean and standard deviation of the training features to be used with the model
pickle.dump(standardize, open(os.path.join(BASE_PATH, 'standardize.p'), 'wb')) # Save the dictionary containing the standardizing parameters to a pickle file

X_train = (X_train - train_mean) / train_std # Standardize the training features
X_valid = (X_valid - train_mean) / train_std # Standardize the validation features
```

<br />

In the same file <i>model.py</i> we will build the model. We will use a Keras sequential model that contains:

-   A dense layer with a ReLU activation function with an output size of 24
-   A dropout layer with a dropout rate of 0.4 (40%)
-   A batch normalization layer
-   A dense layer with a Softmax activation function with an output size of 3 (the number of classes of flowers)

We will then compile this model using an Adam optimizer with a learning rate of 1e-3, a loss function of sparse categorical crossentropy. We will also tell the model to track the accuracy metric during training. We will then fit this data to the training data and validate on the validation data over 64 epochs with a batch size of 64, before saving our model. The code for this section can be found below.

<br />

```python
model = tf.keras.models.Sequential([ # Create the model that will predict the type of flower basedon the features
    tf.keras.layers.Dense(24, activation='relu'),
    tf.keras.layers.Dropout(0.4),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dense(3, activation='softmax')
])
model.compile(optimizer=tf.keras.optimizers.Adam(1e-3), loss=tf.keras.losses.SparseCategoricalCrossentropy(), metrics=['accuracy']) # Compile the model with sparse categorical crossentropy loss, adam optimizer and to track the accuracy of the network

model.fit(X_train, Y_train, batch_size=64, epochs=64, validation_data=(X_valid, Y_valid)) # Fit the model on the training data and validate on the validation data with a batch size of 64 and 64 epochs

model.save(os.path.join(BASE_PATH, 'model.h5')) # Save the model
```

<br />

Once the training has finished, you will see that the model was able to achieve roughly an 89% accuracy on the training data and and roughly an 93.3% accuracy on the validation data which we can accept.

<br />

#### Creating the API:

Now we will create the API that will predict the category of flower that the features sent belong to.

<br />

In a new file <i>app.py</i> in the <i>root</i> directory we will import the dependencies for the project, and will define the class that will be responsible for predicting the cateogory of flower that each set of features belongs to. We will call this class <code>Model</code> and will give it a constructor that will initialize the current working directory, load in our standardization parameters and set them as class members, load in the model and set is as a class member, and declare the mapping from the index of the category with the highest probability output by the model to the name of the flower that that index corresponds to and set is as a class member.

<br />

Then we will create a class method <code>predict_labels</code> that will take in a set of features and determine what category of flowers those features correspond to. We will first standardize the input features using our standardizing mean and standard deviation, and will then make predictions of the labels of these standardized flower features using our model. We will then determine the indices with the highest probabilies for each set of outputs from the model (depending on the number of features fed to the model), which will then be given its appropriate flower name. These labels will then be returned. The code for this section can be found below.

<br />

```python
import numpy as np
import pickle
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

class Model: # Create the class that will be used for predicting the class of a flower given its features
    def __init__(self): # Define a constructor
        base_path = os.getcwd() # Initialize the current directory

        self.standardize = pickle.load(open(os.path.join(base_path, 'standardize.p'), 'rb')) # Load the standardization data from the pickle file
        self.model = tf.keras.models.load_model(os.path.join(base_path, 'model.h5')) # Load the model

        self.labels = {0: 'Setosa', 1: 'Versicolor', 2: 'Virginica'} # Define the labels for the outputs of the model

    def predict_labels(self, features): # Create the function that will predict the labels given the inoput features
        processed_features = (np.array(features) - self.standardize['mean']) / self.standardize['std'] # Standardize the features
        predictions = self.model.predict(processed_features) # Predict the labels for the standardized features
        predictions_argmax = np.argmax(predictions, axis=1).astype(int) # Choose the highest probability label as the predicted label

        labels = [self.labels[pred] for pred in predictions_argmax] # Convert the output indeces from the network to the flowers corresponding label

        return labels # Return the labels
```

<br />

Now we're going to use Flask to create the API that will serve the <code>Model</code> class we just created.

<br />

In the same file <i>app.py</i> we will initialize the Flask <code>app</code> with CORS, and then our <code>Model</code> class inside of the <code>app.config</code>. Now we will create the <i>/predict</i> route which will receive sets of features in the form of a POST request and will return the cateogry of flower of which each set of features belongs to. To do this we will define a route with the URL <i>/predict</i> that will only accept POST requests and will have strict slashes set to false.

<br />

We will then define the function <code>predict</code> that will be called whenever a POST request is sent to this route. We will first get the JSON body from the request, and will then extract the features from the JSON body. We will then use our <code>Model</code> class to predict the category of flower that each set of features corresponds to, before returning these predictions in JSON.

<br />

Finally we will call our <code>app</code>. To do this we will specify that if we run this file directly, indicated by <code>**name** == '**main**'</code> returning true, then we will run our <code>app</code>. The code for this section can be found below.

<br>

```python
app = Flask(__name__) # Initialize flask
CORS(app) # Enable CORS

app.config['MODEL'] = Model() # Initialize the model class

@app.route('/predict', methods=['POST'], strict_slashes=False) # Create the route that will recieve a POST request containing the features of flowers to have their labels predicted
def predict(): # Define the function that will be called when a post request is sent to this route
    form = request.json # Get the json data from the request

    features = form['features'] # Extract the features from the json body
    predicted_labels = app.config['MODEL'].predict_labels(features) # Predict the labels of the features

    return jsonify({'predicted_labels': predicted_labels}) # Return the predicted labels

if __name__ == '__main__': # If this file is run directly
    app.run() # Run the app
```

<br />

#### Containerizing the model:

Now that we have created the API, it is time to package it all together into a Docker image. First of all make you sure you have Docker installed. You can download [Docker desktop here](https://www.docker.com/products/docker-desktop) for Mac and Windows and then simply follow the instructions to install it.

<br />

Once you have installed Docker, the first thing you'll need to do is define the Python packages used for your project within a <i>requirements.txt</i> file located within the <i>root</i> directory. An example of the <i>requirements.txt</i> for this project can be found below. NOTE: while Gunicorn has not been used so far, it will be required for running our API in the container and therefore must be added to the <i>requirements.txt</i>. You may also notice that we have not included TensorFlow in the <i>requirements.txt</i>, and that is because it will already be installed in our environment, and therefore there is no need for us to reinstall it and risk breaking the predefined environment.

<br />

```python
Flask==1.1.1
Flask-Cors==3.0.10
gunicorn==20.0.4
```

<br />

Now we will build our <i>Dockerfile</i> that will allow us to create an image containing our API and its necessary environment. Create a new file named <i>Dockerfile</i> EXACTLY with no file extensions inside of the <i>root</i> directory. Before you can continue building the image, you must install the base image in which we will be building upon. You can do this by downloading the following Docker image using the first command below. This image will contain the environment required to run TensorFlow 2.4.1 with CUDA. If your GPU does not support CUDA, you can install the following Docker image instead using the second command below.

<br />

```bash
docker pull tensorflow/tensorflow:2.4.1-gpu
```

<br />

```bash
docker pull tensorflow/tensorflow:2.4.1
```

<br />

Now copy the lines of code listed below into your <i>Dockerfile</i>. The <code>FROM</code> keyword will determine what image we want to build our image on. The <code>COPY</code> keyword will copy all of the files within our <i>root</i> directory to an <i>app</i> folder on the image. We will then use the <code>RUN</code> keyword to install our requirements from our <i>requirements.txt</i>. Next we'll navigate inside of the image to the <i>app</i> directory using the <code>WORKDIR</code>. Finally, we will run the command <code>gunicorn app:app -b 0.0.0.0:8000</code> using the <code>CMD</code> keyword that will run our <i>app.py</i> with Gunicorn and will bind the server to your IP on the port of 8000. NOTE: if you installed TensorFlow image version 2.4.1 with no CUDA support, change the first line of the file from <code>FROM tensorflow/tensorflow:2.4.1-gpu</code> to <code>FROM tensorflow/tensorflow:2.4.1</code>.

<br />

```docker
FROM tensorflow/tensorflow:2.4.1-gpu

COPY . /app

RUN pip install -r /app/requirements.txt

WORKDIR /app

CMD gunicorn app:app -b 0.0.0.0:8000
```

<br />

Now navigate into your <i>root</i> directory and run the command below.

<br />

```bash
docker build -t app .
```

<br />

You should see that the image was successfully built with the name <i>app</i>. If not go back and check that you followed all of the steps correctly.

<br />

#### Running the container:

Now you can run your image by running the command below. NOTE: you can make the container run in the background by replacing <code>-p</code> with <code>-dp</code> in the command below.

<br />

```bash
docker run -p 8000:8000 app
```

<br />

You should see your container start with no errors. Now you can test your container by making a POST request to [http://127.0.0.1:8000/predict](http://127.0.0.1:8000/predict) with a JSON body that has a key <code>features</code> with a corresponding value of an array containing the features you wish for the model to predict the categories of flowers they belong to. An example can be shown below using [Insomnia](https://insomnia.rest/).

<br />

![An example POST request to the container and its response containing the categories of which each flower belongs to using Insomnia](https://i.imgur.com/663sV4y.png)

<br />

### Outroduction:

So now you know what containerization is, why it's useful, what Docker is, as well as understanding how to actually build a Docker image/container yourself that contains a TensorFlow and Flask REST API. So now take this knowledge and go and containerize all of your awesome machine learning and deep learning models to show off to the world, hassle free!
