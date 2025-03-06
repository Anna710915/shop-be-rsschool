import productIds from "./commonUUID";

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
}

const products: Product[] = [
    {
      id: productIds[0],
      title: "Chocolate Truffle",
      description: "Rich and creamy chocolate truffle made with premium cocoa.",
      price: 5.99,
    },
    {
      id: productIds[1],
      title: "Strawberry Cheesecake",
      description: "Delicious cheesecake with fresh strawberry topping.",
      price: 7.49,
    },
    {
      id: productIds[2],
      title: "Caramel Fudge",
      description: "Soft and chewy caramel fudge with a hint of sea salt.",
      price: 4.99,
    },
    {
      id: productIds[3],
      title: "Macarons",
      description: "A mix of colorful macarons with various flavors.",
      price: 9.99,
    },
    {
      id: productIds[4],
      title: "Honey Baklava",
      description: "Traditional baklava with layers of crispy phyllo and honey.",
      price: 6.99,
    },
    {
      id: productIds[5],
      title: "Lemon Tart",
      description: "Tangy lemon curd in a crisp, buttery tart shell.",
      price: 5.49,
    },
    {
      id: productIds[6],
      title: "Tiramisu",
      description: "Classic Italian tiramisu with espresso-soaked ladyfingers.",
      price: 8.49,
    },
    {
      id: productIds[7],
      title: "Peanut Butter Cups",
      description: "Homemade peanut butter cups coated in dark chocolate.",
      price: 3.99,
    },
    {
      id: productIds[8],
      title: "Marshmallow Brownies",
      description: "Gooey chocolate brownies topped with toasted marshmallows.",
      price: 6.79,
    },
    {
      id: productIds[9],
      title: "Coconut Macaroons",
      description: "Sweet and chewy coconut macaroons drizzled with chocolate.",
      price: 4.49,
    },
];

export default products;