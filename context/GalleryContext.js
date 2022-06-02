import { createContext, useState, useEffect } from "react";
import { useMoralis, useMoralisQuery } from "react-moralis";
import { galleryCoinAbi, galleryCoinAddress } from "../lib/constants";
import { ethers } from "ethers";

export const GalleryContext = createContext();

export const GalleryProvider = ({ children }) => {
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [assets, setAssets] = useState([]);
  const [currentAccount, setCurrentAccount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [amountDue, setAmountDue] = useState("");
  const [etherscanLink, setEtherscanLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState("");
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);

  const {
    authenticate,
    isAuthenticated,
    user,
    enableWeb3,
    isWeb3Enabled,
    Moralis,
  } = useMoralis();

  const {
    data: assetsData,
    error: assetsDataError,
    isLoading: assetsDataisLoading,
  } = useMoralisQuery("assets");

  const {
    data: userData,
    error: userDataError,
    isLoading: userDataisLoading,
  } = useMoralisQuery("_User");

  const getBalance = async () => {
    try {
      if (!isAuthenticated || !currentAccount) return;
      const options = {
        contractAddress: galleryCoinAddress,
        functionName: "balanceOf",
        abi: galleryCoinAbi,
        params: {
          account: currentAccount,
        },
      };

      if (isWeb3Enabled) {
        const transaction = await Moralis.executeFunction(options);
        setBalance(transaction.toString());
      }
    } catch (error) {
      console.log(error);
    }
  };

  const listenToUpdates = async () => {
    let query = new Moralis.Query("EthTransactions");
    let subscription = await query.subscribe();
    subscription.on("update", async (object) => {
      console.log("New Transactions");
      console.log(object);
      setRecentTransactions([object]);
    });
  };
  useEffect(() => {
    const getData = async () => {
      if (isAuthenticated) {
        await getBalance();
        await listenToUpdates();
        const currentUsername = await user?.get("nickname");
        setUsername(currentUsername);
        const account = await user?.get("ethAddress");
        setCurrentAccount(account);
      }
    };
    getData();
  }, [
    isAuthenticated,
    user,
    username,
    currentAccount,
    getBalance,
    listenToUpdates,
  ]);

  useEffect(() => {
    const getData = async () => {
      if (isWeb3Enabled) {
        await getAssets();
        await getOwnedAssets();
      }
    };
    getData();
  }, [assetsData, isWeb3Enabled, assetsDataisLoading, userData]);

  const handleSetUsername = () => {
    if (user) {
      if (nickname) {
        user.set("nickname", nickname);
        user.save();
        setNickname("");
      } else {
        console.log("Can't set empty nickname");
      }
    } else {
      console.log("No user");
    }
  };

  const buyAsset = async (price, asset) => {
    try {
      if (!isAuthenticated) return;
      const options = {
        type: "erc20",
        amount: price,
        receiver: galleryCoinAddress,
        contractAddress: galleryCoinAddress,
      };
      let transaction = await Moralis.transfer(options);
      const receipt = await transaction.wait();

      if (receipt) {
        const res = userData[0].add("ownedAssets", {
          ...asset,
          purchasedDate: Date.now(),
          etherscanLink: `https://rinkeby.etherscan.io/tx/${receipt.transactionHash}`,
        });
        await res.save().then(() => {
          alert("You've successfully purchased this asset!");
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const buyTokens = async () => {
    if (!isAuthenticated) {
      await connectWallet();
    }

    const amount = ethers.BigNumber.from(tokenAmount);
    const price = ethers.BigNumber.from("100000000000000");
    const calcPrice = amount.mul(price);

    console.log(galleryCoinAddress);

    let options = {
      contractAddress: galleryCoinAddress,
      functionName: "mint",
      abi: galleryCoinAbi,
      msgValue: calcPrice,
      params: {
        to: currentAccount,
        amount: amount,
      },
    };
    const transaction = await Moralis.executeFunction(options);
    const receipt = await transaction.wait();
    setIsLoading(false);
    console.log(receipt);
    setEtherscanLink(
      `https://rinkeby.etherscan.io/tx/${receipt.transactionHash}`
    );
  };
  const getAssets = async () => {
    try {
      await enableWeb3();
      setAssets(assetsData);
    } catch (error) {
      console.log(error);
    }
  };

  const getOwnedAssets = async () => {
    try {
      if (userData[0]) {
        setOwnedItems((prevItems) => [
          ...prevItems,
          userData[0].attributes.ownedAssets,
        ]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <GalleryContext.Provider
      value={{
        handleSetUsername,
        isAuthenticated,
        nickname,
        setNickname,
        username,
        assets,
        balance,
        setTokenAmount,
        tokenAmount,
        amountDue,
        setAmountDue,
        setIsLoading,
        isLoading,
        setEtherscanLink,
        etherscanLink,
        currentAccount,
        buyTokens,
        buyAsset,
        recentTransactions,
        ownedItems,
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
};
