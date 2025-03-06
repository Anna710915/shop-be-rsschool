import productIds from "./commonUUID";

export interface Stock {
    product_id: string;
    count: number;
}
  
// Sample Stocks (Using Random UUIDs for Example)
const stocks: Stock[] = [
    { product_id: productIds[0], count: 10 },
    { product_id: productIds[1], count: 5 },
    { product_id: productIds[2], count: 20 },
    { product_id: productIds[3], count: 10 },
    { product_id: productIds[4], count: 5 },
    { product_id: productIds[5], count: 20 },
    { product_id: productIds[6], count: 10 },
    { product_id: productIds[7], count: 5 },
    { product_id: productIds[8], count: 20 },
    { product_id: productIds[9], count: 10 },
];

export default stocks;