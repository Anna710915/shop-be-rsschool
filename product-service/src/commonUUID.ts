import { v4 as uuidv4 } from "uuid";

const productIds: string[] = [];

for (var i = 0; i < 10; i++) {
    productIds.push(uuidv4());
}

export default productIds;