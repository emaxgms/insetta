import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { createOrUpdateUserProfile } from '../utils/db';
import avatars from '../data/avatars.json';
import { Timestamp } from 'firebase/firestore';

export default function Auth() {
  const { user, signInWithGoogle, signInWithEmail, logout, loading, updateUserProfile } = useAuth();
  const [isHovered, setisHovered] = useState(false);
  const [isModalLoginOpen, setisModalLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isModalNameOpen, setisModalNameOpen] = useState(false);
  const [isModalAvatarOpen, setIsModalAvatarOpen] = useState(false);
  const [avatarSelected, setAvatarSelected] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(Date.now());

  useEffect(() => {
    if (user && !user.displayName) {
      setisModalNameOpen(true);
    }
    console.log('refresh');
  }, [user]);

  useEffect(() => { 
    console.log('Avatar selezionato:', avatarSelected);
  }, [avatarSelected]);
  const notHovered = () => {
    setisHovered(false);
  };

  const handleSignInEmail = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithEmail(email, password);
      if (result.success) {
        setError('');
        setisModalLoginOpen(false);
      } else {
        setError('Errore: ' + result.message);
      }
    } catch (err) {
      setError('Credenziali non valide. Riprova.' + err);
    }
  };

  const handleLogOut = () => {
    logout();
    setisHovered(false);  
  }

  const handleSetUsername = async (firstLogin) => {
    if (username.trim() === '') {
      alert('Il nome utente non può essere vuoto.');
      return;
    }

    try {
      await updateUserProfile({displayName: username, lastModifiedDate: Timestamp.now()}); // Aggiorna il displayName
      await createOrUpdateUserProfile(user.uid, { username }); // Aggiorna il profilo nella collezione "users"
      setisModalNameOpen(false); // Chiudi il modal
      if(firstLogin) {
        setIsModalAvatarOpen(true);
        setAvatarSeed(Date.now());
      }
      console.log('Username impostato con successo!');
    } catch (error) {
      console.error('Errore durante l\'impostazione dell\'username:', error);
    }
  };

  const handleUpdateAvatar = async () => {
    if (!avatarSelected) {
      alert('Seleziona un avatar prima di confermare.');
      return;
    }

    try {
      await updateUserProfile({ photoURL: avatarSelected, lastModifiedDate: Timestamp.now() });
      await createOrUpdateUserProfile(user.uid, { photoURL: avatarSelected }); // Aggiorna il profilo nella collezione "users"
      setIsModalAvatarOpen(false);
      console.log('Avatar aggiornato con successo!');
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dell\'avatar:', error);
    }
  };

  if (loading) {
    return <div>Caricamento...</div>;
  }

  return (
    <>
      <div 
        className="auth-container"
        onMouseOver={() => setisHovered(true)}
        onMouseOut={() => setisHovered(false)}
      >
        {user ? (
          <div className="user-info">
            {user.photoURL ?
              <img src={user.photoURL} alt="Avatar" className="user-avatar" onClick={() => {setAvatarSeed(Date.now());setIsModalAvatarOpen(true);}} title='Avatar del profilo'/>
              : <div className="default-avatar" onClick={() => {setAvatarSeed(Date.now());setIsModalAvatarOpen(true);}} title='Avatar del profilo'></div>
            }  
            <span className="user-name" title='Aggiorna Username' onClick={() => {setisModalNameOpen(true);}}>{user.displayName}</span>
            {true && (<button onClick={handleLogOut} className="sign-out-btn" title='Esci dal tuo account'>
              ESCI
            </button>)}
          </div>
        ) : (
          !isHovered ? (
            <button className="sign-in-btn" title='Accedi o Registrati'>ACCEDI</button>
          ) : (
            <div className="login-btns">
              <button onClick={signInWithGoogle} className="google-sign-in-btn" title='Registratio o Accedi con Google'>Google</button>
              <button
                onClick={() => {
                  setisModalLoginOpen(true);
                  setisHovered(false);
                }}
                className="google-sign-in-btn"
                title='Registrati o Accedi con Email'
              >
                Email
              </button>
            </div>
          )
        )}
      </div>
      
      <Modal isOpen={isModalLoginOpen} onNotHovered={notHovered} onClose={() => {setisModalLoginOpen(false);}}>
        <h2>Accedi con Email</h2>
        <form onSubmit={handleSignInEmail} className="form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            title='Email del tuo account'
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            title='Password del tuo account'
          />
          <button type="submit" className='profile-button'  title='Accedi o Registrati con Email'>
            Accedi
          </button>
          {error && <p className="error-message" title='Errore di Registrazione o Login'>{error}</p>}
        </form>
      </Modal>
      <Modal isOpen={isModalNameOpen} onClose={() => {setisModalNameOpen(false);}}>
        <h2>Imposta il tuo Nome Utente</h2>
        <div className="form">
          <input
            type="text"
            placeholder="Inserisci il tuo Nome Utente"
            value={username}
            className='username-input'
            onChange={(e) => setUsername(e.target.value)}
            title='Imposta Nome Utente del tuo Account'
          />
          <button className='profile-button' onClick={() => {handleSetUsername(true);}} title='Salva Nome Utente'>Salva</button>
        </div>
      </Modal>
      <Modal isOpen={isModalAvatarOpen} onClose={() => {setIsModalAvatarOpen(false);}}>
        <h2>Scegli il tuo Avatar</h2>
        <div className="form">
          <div className="avatar-grid">
          {avatars.map((avatar) => {
            const fullUrl = avatar.url + avatarSeed + avatar.id;
            return (
              <div
                key={avatar.id}
                title={avatar.name}
                className={`avatar-option ${avatarSelected === fullUrl ? 'selected' : ''}`}
                onClick={() => setAvatarSelected(fullUrl)}
              >
                <img src={fullUrl} alt={avatar.id} />
              </div>
            );
          })}
          </div>
          <button onClick={handleUpdateAvatar} className='profile-button' disabled={!avatarSelected}>
            Conferma
          </button>
        </div>
      </Modal>
    </>
  );
}
