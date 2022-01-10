/* pages/create-item.js */
import { useState } from "react";
import Web3 from "web3";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { useRouter } from "next/router";
import Web3Modal from "web3modal";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

import { nftAdress, nfMarketAddress } from "../config";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState(null);
    const [formInput, updateFormInput] = useState({
        price: "",
        name: "",
        description: "",
    });
    const router = useRouter();

    async function onChange(e) {
        const file = e.target.files[0];
        try {
            const added = await client.add(file, {
                progress: (prog) => console.log(`received: ${prog}`),
            });
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            setFileUrl(url);
        } catch (error) {
            console.log("Error uploading file: ", error);
        }
    }
    async function createMarket() {
        const { name, description, price } = formInput;
        if (!name || !description || !price || !fileUrl) return;
        /* first, upload to IPFS */
        const data = JSON.stringify({
            name,
            description,
            image: fileUrl,
        });
        try {
            const added = await client.add(data);
            const url = `https://ipfs.infura.io/ipfs/${added.path}`;
            /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
            createSale(url);
        } catch (error) {
            console.log("Error uploading file: ", error);
        }
    }

    async function createSale(url) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new Web3(connection);
        const signer = await provider.eth.getAccounts();

        /* next, create the item */
        let contract = new provider.eth.Contract(NFT.abi, nftAdress, {
            from: signer[0],
        });
        let transaction = await contract.methods.createToken(url).send({
            from: signer[0],
        });
        let tx = await transaction;
        let event = tx.events.Transfer;
        let value = event.returnValues.tokenId;
        let tokenId = Number(value);
        const price = provider.utils.toWei(formInput.price.toString(), "ether");

        /* then list the item for sale on the marketplace */
        contract = new provider.eth.Contract(Market.abi, nfMarketAddress, {
            from: signer[0],
        });
        let listingPrice = await contract.methods.getListingPrice().call();
        listingPrice = listingPrice.toString();

        transaction = await contract.methods
            .createMarketItem(nftAdress, tokenId, price)
            .send({
                from: signer[0],
                value: listingPrice,
            });
        await transaction;
        router.push("/");
    }

    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input
                    placeholder="Asset Name"
                    className="mt-8 border rounded p-4"
                    onChange={(e) =>
                        updateFormInput({ ...formInput, name: e.target.value })
                    }
                />
                <textarea
                    placeholder="Asset Description"
                    className="mt-2 border rounded p-4"
                    onChange={(e) =>
                        updateFormInput({
                            ...formInput,
                            description: e.target.value,
                        })
                    }
                />
                <input
                    placeholder="Asset Price in Eth"
                    className="mt-2 border rounded p-4"
                    onChange={(e) =>
                        updateFormInput({ ...formInput, price: e.target.value })
                    }
                />
                <input
                    type="file"
                    name="Asset"
                    className="my-4"
                    onChange={onChange}
                />
                {fileUrl && (
                    <img
                        className="rounded mt-4"
                        width="350"
                        src={fileUrl}
                        alt={""}
                    />
                )}
                <button
                    onClick={createMarket}
                    className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
                >
                    Create Digital Asset
                </button>
            </div>
        </div>
    );
}
