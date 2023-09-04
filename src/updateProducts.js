const configFilePath = "../config/config.json";

const { writeFile } = require('fs')
const axios = require('axios');
const config = require(configFilePath);
const {
  instanceUrl,
  bm_email,
  bm_psswd,
  clientId,
  clientSecret
} = require('../config/credentials.json');

const getRandomProductId = () => {
  const productIdNumber = Math.floor(Math.random() * 60) + 1;
  return `${config.productIdPrefix}${productIdNumber.toString().padStart(3, '0')}`;
};

const generateIDs = total => {
    const ids = new Set();
    while (ids.size < total) {
        ids.add(getRandomProductId());
    }
    return Array.from(ids);
}

const getToken = async () => {
  try {
    const authKey = btoa(`${bm_email}:${bm_psswd}:${clientSecret}`);
    const reqData = {
      url: `${instanceUrl}/dw/oauth2/access_token`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authKey}`
      },
      data: {
        grant_type: 'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken'
      },
      params: {
        client_id: clientId
      }
    }

    const tokenResponse = await axios(reqData);
    if (tokenResponse.error) {
      console.log(`Error getting the token: ${tokenResponse.error}`);
      return null;
    }
    return tokenResponse.data.access_token
  } catch (e) {
    console.log(`Error with token: ${e}`);
  }
}

const getProductInfo = async (productId) => {
  try {
    const accessToken = await getToken();

    const response = await axios.get(`${instanceUrl}/s/-/dw/data/v23_2/products/${productId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      },
      params: {
        site_id: 'RefArch',
        client_id: clientId,
        expand: 'prices'
      }
    });
    const productInfo = response.data;
    return productInfo;
  } catch (error) {
    console.error('Error al obtener la información del producto:', error);
  }
};

const addProductToConfig = async (id) => {
    console.log(id);
    const prod = await getProductInfo(id);
    const prodData = {
        "product-id": prod.id,
        "product-name": prod.name.default,
        "net-price": prod.price.toFixed(2),
        "tax-rate": "0.08"
    }
    config.productIds.push(prodData);
}

const aysncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

const updateConfigObj = async (totalProducts) => {
    config.productIds = [];
    const totalIds = totalProducts || config.defaultProductPoolSize;
    const ids = generateIDs(totalIds);

    console.log('Fetching products...');
    await aysncForEach(ids, addProductToConfig);
    console.log('Products data successfully retrieved!');
}

const updateProducts = async (totalProducts) => {
    await updateConfigObj(totalProducts);

    writeFile(configFilePath, JSON.stringify(config, null, 2), (error) => {
        if (error) {
            console.log(`An error has occurred updating the config file: ${error}`);
            return;
        }
        console.log("Data written successfully to the file");
    });
}

module.exports = {
    updateProducts: updateProducts
}