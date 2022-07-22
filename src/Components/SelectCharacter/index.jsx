import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './SelectCharacter.css';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import LoadingIndicator from "../../Components/LoadingIndicator";
import MyEpicGame from '../../utils/MyEpicGame.json';

const SelectCharacter = ({ setCharacterNft }) => {

  const [ characters, setCharacters ] = useState([]);
  const [ gameContract, setGameContract ] = useState(null);
  const [ mintingCharacter, setMintingCharacter ] = useState(false);
  
  useEffect(() => {

    const { ethereum } = window;
    if(ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const tempGameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        MyEpicGame.abi,signer
      );

      setGameContract(tempGameContract);
    }else {
      console.log("Ethereum object not found");
    }
  }, []);

  useEffect(() => {
    const getCharacters = async () => {
      try{
        console.log("Getting characters from the contract to mint");
        const charactersTxn = await gameContract.getAllDefaultCharacters();
        console.log("characters txn = ",charactersTxn);
  
        const characters = charactersTxn.map((characterData) => transformCharacterData(characterData));
        setCharacters(characters);
      }catch(error){
        console.log(error);
      }
    }

    const onCharacterMint = async (sender, tokenId, characterIndex) => {
    console.log(
      `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
    );

    if (gameContract) {
      const characterNFT = await gameContract.checkIfUserHasNft();
      console.log('CharacterNFT: ', characterNFT);
      setCharacterNft(transformCharacterData(characterNFT));
    }
  };

    if(gameContract){
      getCharacters();
      gameContract.on('CharacterNFTMinted', onCharacterMint);
    }

    return () => {
      if (gameContract) {
        gameContract.off('CharacterNFTMinted', onCharacterMint);
      }
    };
  }, [gameContract]);

  const handleMintCharacter = async (characterId) => {
    try {
      if (gameContract) {
        setMintingCharacter(true);
        console.log('Minting character in progress...');
        const mintTxn = await gameContract.mintCharacterNFT(characterId);
        await mintTxn.wait();
        console.log('mintTxn:', mintTxn);
        setMintingCharacter(false);
      }
    } catch (error) {
      console.warn('MintCharacterAction Error:', error);
      setMintingCharacter(false);
    }
};
  const renderCharacters = () =>
  characters.map((character, index) => (
    <div className="character-item" key={character.name}>
      <div className="name-container">
        <p>{character.name}</p>
      </div>
      <img src={`https://cloudflare-ipfs.com/ipfs/${character.imageURI}`} />
      <button
        type="button"
        className="character-mint-button"
        onClick={()=> handleMintCharacter(index)}
      >{`Mint ${character.name}`}</button>
    </div>
  ));

  
  return (
    <div className="select-character-container">
      <h2>Mint Your Hero. Choose wisely.</h2>
      {characters.length > 0 && (
      <div className="character-grid">{renderCharacters()}</div>
    )}
      {mintingCharacter && (
        <div className="loading">
          <div className="indicator">
            <LoadingIndicator />
            <p>Minting In Progress...</p>
          </div>
          <img
            src="https://media2.giphy.com/media/61tYloUgq1eOk/giphy.gif?cid=ecf05e47dg95zbpabxhmhaksvoy8h526f96k4em0ndvx078s&rid=giphy.gif&ct=g"
            alt="Minting loading indicator"
          />
        </div>
      )}
    </div>
  );
};

export default SelectCharacter;
