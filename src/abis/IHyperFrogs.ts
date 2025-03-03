export const IHyperFrogsAbi = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "buildSVG",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "burn",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ownerOf",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "tokenTraits",
      "outputs": [
        {
          "internalType": "bool",
          "name": "oneOfOne",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "oneOfOneIndex",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "backdrop",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "hat",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "eyesIndex",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "eyesIsA",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "mouth",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "body",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "feet",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "tokenURI",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];