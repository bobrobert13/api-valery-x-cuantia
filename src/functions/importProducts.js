const processStocks = (products) => {
    let parseProducts = products.reduce((acc, product) => {
        const { CODIGO_PRODUCTO, DEPOSITO_CODIGO } = product;
        let matchingProduct = acc.find(item => item.CODIGO_PRODUCTO === CODIGO_PRODUCTO);

        !matchingProduct ? (() => {
            matchingProduct = {
                ...product,
                EXISTENCIA_DETAL: DEPOSITO_CODIGO === '01' ? parseFloat((product.EXISTENCIA_ACTUAL).toFixed(2)) : 0.00,
                EXISTENCIA_MAYOR: DEPOSITO_CODIGO === '02' ? parseFloat((product.EXISTENCIA_ACTUAL).toFixed(2)) : 0.00,
                EXISTENCIA_TOTAL: 0.00
            };
            acc.push(matchingProduct);
        })() : (() => {
            DEPOSITO_CODIGO === '01' ? matchingProduct.EXISTENCIA_DETAL = parseFloat((product.EXISTENCIA_ACTUAL).toFixed(2)) : matchingProduct.EXISTENCIA_MAYOR = parseFloat((product.EXISTENCIA_ACTUAL).toFixed(2))

            matchingProduct.EXISTENCIA_TOTAL = matchingProduct.EXISTENCIA_DETAL + matchingProduct.EXISTENCIA_MAYOR;
        })()

        delete matchingProduct.EXISTENCIA_ACTUAL;
        delete matchingProduct.DEPOSITO_CODIGO;

        return acc;
    }, []);
    let i = 0
    for (const product of parseProducts) {
        if (product.EXISTENCIA_MAYOR && !product.EXISTENCIA_DETAL) {
            parseProducts[i] = ({
                ...product,
                EXISTENCIA_DETAL: 0.00,
                EXISTENCIA_TOTAL: product.EXISTENCIA_MAYOR

            });
        } else if (!product.EXISTENCIA_MAYOR && product.EXISTENCIA_DETAL) {
            parseProducts[i] = ({
                ...product,
                EXISTENCIA_MAYOR: 0.00,
                EXISTENCIA_TOTAL: product.EXISTENCIA_DETAL
            });
        }
        i++
    }
    return parseProducts
}

export { processStocks }