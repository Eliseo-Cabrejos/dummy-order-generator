const { writeFile } = require("fs").promises;
const axios = require("axios");
const path = require("path");

const config = require("../config/config.json");
const {
  instanceUrl,
  bm_email,
  bm_psswd,
  clientId,
  clientSecret,
} = require("../config/credentials.json");

module.exports = class ProductsManager {
  constructor(totalProducts) {
    this.products = [];
    this.totalProducts = totalProducts || config.defaultProductPoolSize;
    this.destFilePath = path.join(__dirname, "..", "config", "products.json");
  }

  updateProducts = async () => {
    this.accessToken = await this.getToken();
    await this.getProductsData();
    await this.updateProductsFile();
  };

  getToken = async () => {
    try {
      const authKey = btoa(`${bm_email}:${bm_psswd}:${clientSecret}`);
      const reqData = {
        url: `${instanceUrl}/dw/oauth2/access_token`,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authKey}`,
        },
        data: {
          grant_type:
            "urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken",
        },
        params: {
          client_id: clientId,
        },
      };

      const tokenResponse = await axios(reqData);
      if (tokenResponse.error) {
        console.log(`Error getting the token: ${tokenResponse.error}`);
        return null;
      }
      return tokenResponse.data.access_token;
    } catch (e) {
      console.log(
        "There as an error getting the access token. Please ensure the data in config.json is setup correctly"
      );
      throw new Error(`Error retrieving access token: ${e}`);
    }
  };

  getProductsData = async () => {
    const ids = this.generateIDs();
    await this.aysncForEach(ids, this.addProductToConfig);
    console.log("Products' data successfully retrieved!");
  };

  updateProductsFile = async () => {
    console.log("Writing data to file...");
    await writeFile(this.destFilePath, JSON.stringify(this.products, null, 2))
      .then(() => console.log("Data written successfully to the file!"))
      .catch((error) =>
        console.log(`An error has occurred updating the config file: ${error}`)
      );
  };

  generateIDs = () => {
    const ids = new Set();
    while (ids.size < this.totalProducts) {
      ids.add(this.getRandomProductId());
    }
    return Array.from(ids);
  };

  getRandomProductId = () => {
    const productIdNumber = Math.ceil(Math.random() * config.maxProductId);
    return `${config.productIdPrefix}${productIdNumber
      .toString()
      .padStart(3, "0")}`;
  };


  addProductToConfig = async (id) => {
    console.log(`Fetching ${id}...`);
    const prod = await this.getProductInfo(id);
    const prodData = {
      "product-id": prod.id,
      "product-name": prod.name.default,
      "net-price": prod.price.toFixed(2),
      "tax-rate": "0.08",
    };
    this.products.push(prodData);
  };

  getProductInfo = async (productId) => {
    try {
      const response = await axios.get(
        `${instanceUrl}/s/-/dw/data/v23_2/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: "application/json",
          },
          params: {
            site_id: "RefArch",
            client_id: clientId,
            expand: "prices",
          },
        }
      );
      const productInfo = response.data;
      return productInfo;
    } catch (error) {
      console.error("Error al obtener la información del producto:", error);
    }
  };

  aysncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
   }
  };
};
