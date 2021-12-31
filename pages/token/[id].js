/* pages/my-assets.js */
import Web3 from "web3";
import { useEffect, useState } from "react";
import { getAllTokenIds, getTokenData } from "../../lib/tokens";
import axios from "axios";
import Web3Modal from "web3modal";

import { nftAdress, nfMarketAddress } from "../../config";

import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function Token({ tokenData }) {
    const [nft, setNft] = useState({});
    const [loadingState, setLoadingState] = useState("not-loaded");
    useEffect(() => {
        loadNFTs();
    }, []);
    async function loadNFTs() {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new Web3(connection);
        const signer = await provider.eth.getAccounts();

        const marketContract = new provider.eth.Contract(
            Market.abi,
            nfMarketAddress,
            {
                from: signer[0],
            }
        );
        const tokenContract = new provider.eth.Contract(NFT.abi, nftAdress);
        const data = await marketContract.methods.fetchMyNFTs().call();

        const item = await Promise.all(
            data.map(async (i) => {
                const tokenUri = await tokenContract.methods
                    .tokenURI(i.tokenId)
                    .call();
                const meta = await axios.get(tokenUri);
                let price = provider.utils.fromWei(i.price.toString(), "ether");
                let item = {
                    price,
                    tokenId: i.tokenId,
                    seller: i.seller,
                    owner: i.owner,
                    image: meta.data.image,
                };
                const data2 = await tokenContract.methods;
                console.log(await data2.tokenURI(1).call());
                return item;
            })
        );
        setNft(item[0]);
        setLoadingState("loaded");
    }
    async function buyNft(nft) {
        /* needs the user to sign the transaction, so will use Web3Provider and sign it */
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new Web3(connection);
        const signer = await provider.eth.getAccounts();
        const contract = new provider.eth.Contract(Market.abi, nfMarketAddress);

        /* user will be prompted to pay the asking proces to complete the transaction */
        const price = provider.utils.toWei(nft.price.toString(), "ether");
        const transaction = await contract.methods
            .createMarketSale(nftAdress, nft.tokenId)
            .send({
                from: signer[0],
                value: price,
            });
        await transaction;
        loadNFTs();
    }
    if (loadingState === "loaded" && !nft)
        return <h1 className="py-10 px-20 text-3xl">No assets owned</h1>;
    return (
        <div className="flex justify-center">
            {/* {console.log(nft)} */}
            <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <div className="border shadow rounded-xl overflow-hidden">
                        <div className="p-4 bg-black">
                            <p className="text-2xl font-bold text-white">
                                Price - {nft.price} Eth
                            </p>
                            <button
                                className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                                onClick={() => buyNft(nft)}
                            >
                                Buy
                            </button>
                        </div>
                    </div>
                    <div className="border shadow rounded-xl overflow-hidden">
                        <img src={nft.image} className="rounded" />
                    </div>
                    <div className="border shadow rounded-xl overflow-hidden">
                        <p className="text-2xl font-bold">Details</p>
                        <p className="text-2xl font-bold">
                            Contract Address - {nft.price}
                        </p>
                        <p className="text-2xl font-bold">
                            Token ID - {nft.tokenId}
                        </p>
                        <p className="text-2xl font-bold">
                            Token Standard - {nft.price}
                        </p>
                        <p className="text-2xl font-bold">
                            Blockchain - {nft.price}
                        </p>
                    </div>
                    <div className="border shadow rounded-xl overflow-hidden">
                        <p className="text-2xl font-bold">Lisings</p>
                        <p className="text-2xl font-bold">{nft.price} ETH</p>
                        <p className="text-2xl font-bold">
                            {nft.price}
                            USD Price
                        </p>
                        <p className="text-2xl font-bold">
                            {nft.price}
                            Expiration
                        </p>
                        <p className="text-2xl font-bold">
                            {nft.price}
                            From
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export async function getStaticPaths() {
    const paths = getAllTokenIds();
    return {
        paths,
        fallback: false,
    };
}

export async function getStaticProps({ params }) {
    const tokenData = await getTokenData(params.id);
    return {
        props: {
            tokenData,
        },
    };
}
