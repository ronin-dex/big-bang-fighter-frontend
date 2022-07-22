import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import MyEpicGame from '../../utils/MyEpicGame.json';
import './Arena.css';
import LoadingIndicator from "../../Components/LoadingIndicator";

const Arena = ({ characterNft, setCharacterNft, userAccount }) => {
  // State
  const [ gameContract, setGameContract ] = useState(null);
  const [ boss, setBoss ] = useState(null);
  const [attackState, setAttackState] = useState('');
  const [showToast, setShowToast] = useState(false);

  const runAttackAction = async () => {
    try {
      if (gameContract) {
        setAttackState('attacking');
        console.log('Attacking boss...');
        const attackTxn = await gameContract.attackBoss();
        await attackTxn.wait();
        console.log('attackTxn:', attackTxn);
        setAttackState('hit');
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error attacking boss:', error);
      setAttackState('');
    }
  };
  
  // UseEffects
  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        MyEpicGame.abi,
        signer
      );

      setGameContract(gameContract);
    } else {
      console.log('Ethereum object not found');
    }
  }, []);

  useEffect(() => {
    const fetchBoss = async () => {
      const bossTxn = await gameContract.getBigBoss();
      console.log('Boss:', bossTxn);
      setBoss(transformCharacterData(bossTxn));
    };

    const onAttackComplete = (from, newBossHp, newPlayerHp) => {
      const bossHp = newBossHp.toNumber();
      const playerHp = newPlayerHp.toNumber();
      const sender = from.toString();

      console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

      /*
      * If player is our own, update both player and boss Hp
      */
      if (userAccount === sender.toLowerCase()) {

        setBoss((prevState) => {
            return { ...prevState, hp: bossHp };
        });
        setCharacterNft((prevState) => {
            return { ...prevState, hp: playerHp };
        });
      }
      /*
      * If player isn't ours, update boss Hp only
      */
      else {
        setBoss((prevState) => {
            return { ...prevState, hp: bossHp };
        });
      }
    }

    if(gameContract) {
      fetchBoss();
      gameContract.on('AttackComplete', onAttackComplete);
    }

    return () => {
      if (gameContract) {
          gameContract.off('AttackComplete', onAttackComplete);
      }
    }
  },[gameContract])

  if(!boss) return null;

  return (
    <div className="arena-container">
      {boss && characterNft && (
        <div id="toast" className={showToast ? 'show' : ''}>
          <div id="desc">{`💥 ${boss.name} was hit for ${characterNft.attackDamage}!`}</div>
        </div>
      )}
        {/* Boss */}
        <div className="boss-container">
          <div className={`boss-content ${attackState}`}>
            <h2>🔥 {boss.name} 🔥</h2>
            <div className="image-content">
              <img src={`https://cloudflare-ipfs.com/ipfs/${boss.imageURI}`} />
              <div className="health-bar">
                <progress value={boss.hp} max={boss.maxHp} />
                <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
              </div>
            </div>
            {attackState === 'attacking' && (
              <div className="loading-indicator">
                <LoadingIndicator />
                <p>Attacking ⚔️</p>
              </div>
            )}
          </div>
          <div className="attack-container">
            <button className="cta-button" onClick={runAttackAction}>
              {`💥 Attack ${boss.name}`}
            </button>
          </div>
        </div>
      
      {characterNft && (
        <div className="players-container">
          <div className="player-container">
            <h2>Your Character</h2>
            <div className="player">
              <div className="image-content">
                <h2>{characterNft.name}</h2>
                <img
                  src={`https://cloudflare-ipfs.com/ipfs/${characterNft.imageURI}`}
                  alt={`Character ${characterNft.name}`}
                />
                <div className="health-bar">
                  <progress value={characterNft.hp} max={characterNft.maxHp} />
                  <p>{`${characterNft.hp} / ${characterNft.maxHp} HP`}</p>
                </div>
              </div>
              <div className="stats">
                <h4>{`⚔️ Attack Damage: ${characterNft.attackDamage}`}</h4>
              </div>
            </div>
          </div>
          {/* <div className="active-players">
          <h2>Active Players</h2>
          <div className="players-list">{renderActivePlayersList()}</div>
        </div> */}
        </div>
      )}
    </div>
  );
};

export default Arena;