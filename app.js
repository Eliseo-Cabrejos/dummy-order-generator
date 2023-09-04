const main = async () => {
  if (process.argv.indexOf('-u') > -1 || process.argv.indexOf('--update-products') > -1) {
    const ProductsManager = require('./src/ProductsManager');
    const totalProductsIndex = process.argv.indexOf('--total-products');
    let totalProducts;
    if (totalProductsIndex > -1) {
      totalProducts = parseInt(process.argv[totalProductsIndex + 1]);
      if (isNaN(totalProducts)) {
        console.log('There was no total-products value provided. Default value will be used.');
      }
    }
    console.log('Updating products file...');
    const productsManager = new ProductsManager(totalProducts);
    await productsManager.updateProducts();
  }
  if (process.argv.indexOf('-xml') > -1 || process.env.npm_xml) {
    console.log('Generating XML...');
    const generateXML = require('./src/generateXML');
    generateXML();
  }
};

main();