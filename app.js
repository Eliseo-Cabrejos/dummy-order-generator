const { updateProducts } = require('./src/updateProducts');
const generateXML = require('./src/generateXML');

const main = async () => {
  if (process.argv.indexOf('-u') > -1 || process.argv.indexOf('--update-products') > -1) {
    const totalProductsIndex = process.argv.indexOf('--total-products');
    let totalProducts;
    if (totalProductsIndex > -1) {
      totalProducts = parseInt(process.argv[totalProductsIndex + 1]);
      if (isNaN(totalProducts)) {
        console.log('Provided a --total-products flag but not the value as an integer.')
        return;
      }
    }
    console.log('Updating products file...');
    await updateProducts(totalProducts);
  }

  console.log('Generating XML...')
  generateXML();
};

main();