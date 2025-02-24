import { APIGatewayProxyHandler } from 'aws-lambda';

const products = [
  {
    id: "1",
    title: "Chocolate Truffle",
    description: "Rich and creamy chocolate truffle made with premium cocoa.",
    price: 5.99,
  },
  {
    id: "2",
    title: "Strawberry Cheesecake",
    description: "Delicious cheesecake with fresh strawberry topping.",
    price: 7.49,
  },
  {
    id: "3",
    title: "Caramel Fudge",
    description: "Soft and chewy caramel fudge with a hint of sea salt.",
    price: 4.99,
  },
  {
    id: "4",
    title: "Macarons",
    description: "A mix of colorful macarons with various flavors.",
    price: 9.99,
  },
  {
    id: "5",
    title: "Honey Baklava",
    description: "Traditional baklava with layers of crispy phyllo and honey.",
    price: 6.99,
  },
  {
    id: "6",
    title: "Lemon Tart",
    description: "Tangy lemon curd in a crisp, buttery tart shell.",
    price: 5.49,
  },
  {
    id: "7",
    title: "Tiramisu",
    description: "Classic Italian tiramisu with espresso-soaked ladyfingers.",
    price: 8.49,
  },
  {
    id: "8",
    title: "Peanut Butter Cups",
    description: "Homemade peanut butter cups coated in dark chocolate.",
    price: 3.99,
  },
  {
    id: "9",
    title: "Marshmallow Brownies",
    description: "Gooey chocolate brownies topped with toasted marshmallows.",
    price: 6.79,
  },
  {
    id: "10",
    title: "Coconut Macaroons",
    description: "Sweet and chewy coconut macaroons drizzled with chocolate.",
    price: 4.49,
  },
];

export const getProductListHandler: APIGatewayProxyHandler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Allow all origins
      "Access-Control-Allow-Methods": "GET", // Allow GET method
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: JSON.stringify(products),
  };
};
