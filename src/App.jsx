import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import twitterLogo from './assets/twitter-logo.svg';
import SelectCharacter from "./Components/SelectCharacter";
import LoadingIndicator from './Components/LoadingIndicator';
import Arena from './Components/Arena';
import { CONTRACT_ADDRESS, transformCharacterData } from './constants';
import MyEpicGame from './utils/MyEpicGame.json';
import './App.css';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {

  const [ userAccount, setUserAccount ] = useState(null);
  const [ characterNft, setCharacterNft ] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // check if wallet is connected
  const checkIfWalletIsConnected = async () => {
    try{
      const { ethereum } = window;
      if(!window) {
        console.log('Make sure you have metamask');
      }else {
        console.log('We have the ethereum object', ethereum);
        const accounts = await ethereum.request({method: 'eth_accounts'});
        if(accounts.length != 0) {
          const account = accounts[0];
          console.log("Found an authorized ethereum account",account);
          setUserAccount(account);
        }else {
          console.log("No authorized account found!");
        }
      }
    }catch(e) {
      console.log(e);
    }
  };

  // on wallet connect button handler
  const onConnectWallet = async () => {
    try {
      const { ethereum } = window;
      if(! ethereum ) {
        setIsLoading(false);
        alert("Get metamask");
        return;
      }else {
        const accounts = await ethereum.request({
          method: 'eth_requestAccounts'
        });
        console.log("Connected ",accounts[0]);
        setUserAccount(accounts[0]);
      }
    }catch(e) {
      console.log(e);
    }
    setIsLoading(false);
  };

  // check if network is rinkeby
  const checkNetwork = async () => {
    try { 
      if (window.ethereum.networkVersion !== '4') {
        alert("Please connect to Rinkeby!")
      }
    } catch(error) {
      console.log(error)
    }
  }

  useEffect(() => {
    setIsLoading(true);
    checkIfWalletIsConnected();
    checkNetwork();
  },[]);

  useEffect(() => {
    const fetchNFTMetadata = async () => {
      console.log('Checking for Character NFT on address:', userAccount);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        MyEpicGame.abi,
        signer
      );
  
      const txn = await gameContract.checkIfUserHasNft();
      if (txn.name) {
        console.log('User has character NFT');
        setCharacterNft(transformCharacterData(txn));
      } else {
        console.log('No character NFT found');
      }
    };
    setIsLoading(false);
    if(userAccount) {
      console.log("Current user account = ",userAccount);
      fetchNFTMetadata();
    }
  }, [userAccount])

  
  // Render methods
  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator />;
    }
    // Scenario #1
    if(!userAccount) {
      return (
        <div className="connect-wallet-container">
            <img src="https://c.tenor.com/_kXRACNRjYQAAAAC/the-big-bang-theory-big-bang-theory.gif"/>
            <button
              className="cta-button connect-wallet-button"
              onClick={onConnectWallet}
            >
              Connect Wallet To Get Started
            </button>
          </div>
      );
      // Scenario #2
    }else if(userAccount && !characterNft) {
      return <SelectCharacter setCharacterNft={setCharacterNft} />;
    }else if(userAccount && characterNft) {
      return <Arena characterNft = { characterNft } setCharacterNft = {setCharacterNft} userAccount = { userAccount } />
    }
  }


  
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">The Big Bang Fighter</p>
          <p className="sub-text">Fight the boss using your favourite big bang theory character.</p>
          { renderContent() }
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
