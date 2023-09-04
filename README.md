
# Dummy Order Generator

This module generates an xml file with X number of orders ready to be imported into an SFCC instance. By modifying the config.json file, you can customize the generated file by selecting the number of oreders to be generated, the start order number, the order prefix, etc.


## Run Locally

Clone the project

```bash
  git clone https://github.com/Eliseo-Cabrejos/dummy-order-generator.git
```

Go to the project directory

```bash
  cd dummy-order-generator
```

Install dependencies

```bash
  npm install
```

Follow the instructions on [Configuration files](#configuration-files) and then run

```bash
  npm run init
```


## Configuration files
You need to create a couple of json files under the config directory. These are required for the script to run correctly.
### credentials.json
First, credentials.json, which should look like this:

```json
// config/credentials.json
{
    "instanceUrl": "", // The url of your instance.
    "bm_email": "", // The email of your business manager user.
    "bm_psswd": "", // API Key generated in the business manager.
    "clientId": "", // Client ID with Data permissions
    "clientSecret": "" // Secret of the client
}
```
This file allows the script to fetch data from your instance and store the necessary information of a couple of products to generate the orders.

### config.json
Then, next to credentials.json, you need to create the config.json file, containing the following fields:
```json
// config/config.json
{
  "numOrders": 3000,
  "startOrderNumber": 1,
  "maxProductsPerOrder": 3,
  "maxProductQuantity": 5,
  "defaultProductPoolSize": 5,
  "orderNumberPrefixRegex": "",
  "productIdPrefix": "WTV-",
  "maxProductId": 60
}
```
This file allows you to tell the script how it should generate the xml.

## Usage/Examples
After you are done with the config files, you can now run the program! Here are the npm scripts and how to use them:

### init
Initializes the program, fetching product data from your instance and creating config/products.json.
```bash
  npm run init
```
You can also pass the number of products you want to fetch. For example, if you wanted to fetch 50 products:
```bash
  npm run init -- 50
```

### start
If you already have a products.json file, then you can just run one of the following commands (whichever you prefer) to generate the xml file. No new product data will be fetched.
```bash
  npm start
  // or
  npm run start
```

### products
If you just want to update the products.json file, you can run:
```bash
  npm run products
```
And just like with init, you can pass the number of products to fetch:
```bash
  npm run products -- 50
```
