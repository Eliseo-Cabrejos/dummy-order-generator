const fs = require("fs");
const xmlbuilder = require("xmlbuilder");
const config = require("../config/config.json");

const { faker } = require('@faker-js/faker/locale/en_US');

function calculateTax(price, taxRate) {
  return (parseFloat(price) * parseFloat(taxRate)).toFixed(2);
}

function getRandomProducts() {
  const products = new Set();
  const maxProducts = config.maxProductsPerOrder > config.productIds.length ? config.productIds.length : config.maxProductsPerOrder;
  const totalProducts = Math.ceil(Math.random() * maxProducts);
  while (products.size < totalProducts) {
    products.add(config.productIds[Math.floor(Math.random() * config.productIds.length)]);
  }
  return Array.from(products);
}

function generateCustomerData() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: faker.internet.email(),
    street: faker.location.streetAddress(),
    zipCode: faker.location.zipCode(),
    city: faker.location.city(),
    stateCode: faker.location.state({ abbreviated: true}),
    phone: faker.phone.number('###-###-####')
  }
}

function generateOrder(orderNumber, customerData) {
  const orderElement = xmlbuilder.create("order");
  orderElement.att("order-no", orderNumber);

  orderElement.ele("order-date", {}, "2023-08-29T18:14:34.000Z");
  orderElement.ele("created-by", {}, "storefront");
  orderElement.ele("original-order-no", {}, orderNumber);
  orderElement.ele("currency", {}, "USD");
  orderElement.ele("customer-locale", {}, "en_US");
  orderElement.ele("taxation", {}, "net");
  orderElement.ele("invoice-no", {}, "00000501");

  const customer = orderElement.ele("customer");
  customer.ele("customer-name", {}, customerData.fullName);
  customer.ele("customer-email", {}, customerData.email);

  const billingAddress = customer.ele("billing-address");
  billingAddress.ele("first-name", {}, customerData.firstName);
  billingAddress.ele("last-name", {}, customerData.lastName);
  billingAddress.ele("address1", {}, customerData.street);
  billingAddress.ele("city", {}, customerData.city);
  billingAddress.ele("postal-code", {}, customerData.zipCode);
  billingAddress.ele("state-code", {}, customerData.stateCode);
  billingAddress.ele("country-code", {}, "US");
  billingAddress.ele("phone", {}, customerData.phone);

  const status = orderElement.ele("status");
  status.ele("order-status", {}, "NEW");
  status.ele("shipping-status", {}, "NOT_SHIPPED");
  status.ele("confirmation-status", {}, "CONFIRMED");
  status.ele("payment-status", {}, "NOT_PAID");

  orderElement.ele("current-order-no", {}, orderNumber);

  const productLineItems = orderElement.ele("product-lineitems");
  let merchandiseTotalNetPrice = 0;
  let merchandiseTotalTax = 0;

  const selectedProducts = getRandomProducts();
  for (const product of selectedProducts) {
    const productLineItem = productLineItems.ele("product-lineitem");
    const netPrice = product["net-price"];
    const taxRate = product["tax-rate"];
    const tax = calculateTax(netPrice, taxRate);
    const grossPrice = (parseFloat(netPrice) + parseFloat(tax)).toFixed(2);

    merchandiseTotalNetPrice += parseFloat(netPrice);
    merchandiseTotalTax += parseFloat(tax);

    productLineItem.ele("net-price", {}, netPrice);
    productLineItem.ele("tax", {}, tax);
    productLineItem.ele("gross-price", {}, grossPrice);
    productLineItem.ele("base-price", {}, netPrice);
    productLineItem.ele("lineitem-text", {}, product["product-name"]);
    productLineItem.ele("tax-basis", {}, netPrice);
    productLineItem.ele("position", {}, "1"); // Assuming constant value for position
    productLineItem.ele("product-id", {}, product["product-id"]);
    productLineItem.ele("product-name", {}, product["product-name"]);
    productLineItem.ele("quantity", { unit: "" }, Math.ceil(Math.random() * config.maxProductQuantity).toFixed(1));
    productLineItem.ele("tax-rate", {}, taxRate);
    productLineItem.ele("shipment-id", {}, "00000501");
    productLineItem.ele("gift", {}, "false");
  }

  const shippingLineItems = orderElement.ele("shipping-lineitems");
  const shippingLineItem = shippingLineItems.ele("shipping-lineitem");
  shippingLineItem.ele("net-price", {}, "5.99");
  shippingLineItem.ele("tax", {}, "0.30");
  shippingLineItem.ele("gross-price", {}, "6.29");
  shippingLineItem.ele("base-price", {}, "5.99");
  shippingLineItem.ele("lineitem-text", {}, "Shipping");
  shippingLineItem.ele("tax-basis", {}, "5.99");
  shippingLineItem.ele("item-id", {}, "STANDARD_SHIPPING");
  shippingLineItem.ele("shipment-id", {}, "00000501");
  shippingLineItem.ele("tax-rate", {}, "0.05");

  const shipments = orderElement.ele("shipments");
  const shipment = shipments.ele("shipment", { "shipment-id": "00000501" });
  const shipmentStatus = shipment.ele("status");
  shipmentStatus.ele("shipping-status", {}, "NOT_SHIPPED");
  shipment.ele("shipping-method", {}, "001");
  const shippingAddress = shipment.ele("shipping-address");
  shippingAddress.ele("first-name", {}, customerData.name);
  shippingAddress.ele("last-name", {}, customerData.lastName);
  shippingAddress.ele("address1", {}, customerData.street);
  shippingAddress.ele("city", {}, customerData.city);
  shippingAddress.ele("postal-code", {}, customerData.zipCode);
  shippingAddress.ele("state-code", {}, customerData.stateCode);
  shippingAddress.ele("country-code", {}, "US");
  shippingAddress.ele("phone", {}, customerData.phone);
  shipment.ele("gift", {}, "false");

  const totals = orderElement.ele("totals");
  const merchandiseTotal = totals.ele("merchandize-total");
  merchandiseTotal.ele("net-price", {}, merchandiseTotalNetPrice.toFixed(2));
  merchandiseTotal.ele("tax", {}, merchandiseTotalTax.toFixed(2));
  merchandiseTotal.ele(
    "gross-price",
    {},
    (merchandiseTotalNetPrice + merchandiseTotalTax).toFixed(2)
  );

  const adjustedMerchandiseTotal = totals.ele("adjusted-merchandize-total");
  adjustedMerchandiseTotal.ele(
    "net-price",
    {},
    merchandiseTotalNetPrice.toFixed(2)
  );
  adjustedMerchandiseTotal.ele("tax", {}, merchandiseTotalTax.toFixed(2));
  adjustedMerchandiseTotal.ele(
    "gross-price",
    {},
    (merchandiseTotalNetPrice + merchandiseTotalTax).toFixed(2)
  );

  const shippingTotal = totals.ele("shipping-total");
  shippingTotal.ele("net-price", {}, "5.99");
  shippingTotal.ele("tax", {}, "0.30");
  shippingTotal.ele("gross-price", {}, "6.29");

  const adjustedShippingTotal = totals.ele("adjusted-shipping-total");
  adjustedShippingTotal.ele("net-price", {}, "5.99");
  adjustedShippingTotal.ele("tax", {}, "0.30");
  adjustedShippingTotal.ele("gross-price", {}, "6.29");

  const orderTotal = totals.ele("order-total");
  orderTotal.ele(
    "net-price",
    {},
    (merchandiseTotalNetPrice + parseFloat("5.99")).toFixed(2)
  );
  orderTotal.ele(
    "tax",
    {},
    (merchandiseTotalTax + parseFloat("0.30")).toFixed(2)
  );
  orderTotal.ele(
    "gross-price",
    {},
    (
      merchandiseTotalNetPrice +
      merchandiseTotalTax +
      parseFloat("5.99") +
      parseFloat("0.30")
    ).toFixed(2)
  );

  const payments = orderElement.ele("payments");
  const payment = payments.ele("payment");
  const creditCard = payment.ele("credit-card");
  creditCard.ele("card-type", {}, "VISA");
  creditCard.ele("card-number", {}, "XXXX-XXXX-XXXX-1111");
  creditCard.ele("card-holder", {}, customerData.fullName);
  creditCard.ele("card-token", {}, "frc588w7399");
  creditCard.ele("expiration-month", {}, "6");
  creditCard.ele("expiration-year", {}, "2028");
  payment.ele("amount", {}, "43.04");
  payment.ele("processor-id", {}, "BASIC_CREDIT");
  payment.ele("transaction-id", {}, "00000101");

  orderElement.ele("remoteHost", {}, "187.190.195.184");

  return orderElement;
}

module.exports = function () {
  const root = xmlbuilder.create("orders", {
    version: "1.0",
    encoding: "UTF-8",
  });
  root.att("xmlns", "http://www.demandware.com/xml/impex/order/2006-10-31");

  for (let i = 0; i < config.numOrders; i++) {
    const orderNumber = `${config.orderNumberPrefixRegex}${
      config.startOrderNumber + i
    }`.padStart(4, '0');
    const customerData = generateCustomerData();
    const order = generateOrder(orderNumber, customerData);
    root.importDocument(order);
  }

  const xmlString = root.end({ pretty: true });

  const path = config.outputPath + 'generatedOrders.xml';

  fs.writeFile(path, xmlString, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log("XML file generated successfully.");
    }
  });
}


