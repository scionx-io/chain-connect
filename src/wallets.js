import { WALLET_ICONS } from './config.js';

export function renderWallets(mipdStore, controller) {
  const walletButtonsContainer = controller.walletButtonsTarget;
  walletButtonsContainer.innerHTML = '';

  // Group all wallets by blockchain family
  const allGroupedWallets = {
    evm: [],
    solana: [],
    tron: [],
    multiChain: [] // To store wallets that support multiple chains among EVM, Solana, Tron
  };

  const mipdWallets = mipdStore.getProviders();

  console.log('Total MIPD wallets detected:', mipdWallets.length);
  
  // Categorize MIPD wallets, but only include those that support EVM, Solana, or Tron
  mipdWallets.forEach(wallet => {
    console.log(`Processing wallet: ${wallet.info.name} (RDNS: ${wallet.info.rdns}), chains:`, wallet.info.chains);
    
    const families = getWalletFamilies(wallet.info.chains);
    
    // Only process wallets that support at least one of our supported chains (EVM, Solana, Tron)
    const supportedFamilies = families.filter(family => ['evm', 'solana', 'tron'].includes(family));
    
    // If no chain info available, attempt to infer from RDNS if it's a known wallet for our supported chains
    if (supportedFamilies.length === 0 && wallet.info.rdns) {
      if (wallet.info.rdns.includes('metamask') || wallet.info.rdns.includes('coinbase') || 
          wallet.info.rdns.includes('rabby') || wallet.info.rdns.includes('trust') || 
          wallet.info.rdns.includes('mathwallet')) {
        allGroupedWallets.evm.push({...wallet, families: ['evm']});
        console.log(`  -> Categorized as EVM based on RDNS: ${wallet.info.rdns}`);
      } else if (wallet.info.rdns.includes('phantom')) {
        // Phantom supports both EVM and Solana
        allGroupedWallets.multiChain.push({...wallet, families: ['evm', 'solana']});
        console.log(`  -> Categorized as Multi-chain (EVM and Solana) based on RDNS: ${wallet.info.rdns}`);
      } else if (wallet.info.rdns.includes('solflare') || wallet.info.rdns.includes('sollet')) {
        allGroupedWallets.solana.push({...wallet, families: ['solana']});
        console.log(`  -> Categorized as Solana based on RDNS: ${wallet.info.rdns}`);
      } else if (wallet.info.rdns.includes('tron') || wallet.info.rdns.includes('tokenpocket')) {
        allGroupedWallets.tron.push({...wallet, families: ['tron']});
        console.log(`  -> Categorized as Tron based on RDNS: ${wallet.info.rdns}`);
      } else {
        // If RDNS doesn't match any known wallet types for our supported chains, skip it
        console.log(`  -> Skipping wallet ${wallet.info.name} - not recognized as EVM, Solana, or Tron wallet`);
      }
    } else if (supportedFamilies.length > 0) {
      // The wallet supports at least one of our supported chains
      if (supportedFamilies.length > 1) {
        // Multi-chain wallet
        allGroupedWallets.multiChain.push({...wallet, families: supportedFamilies});
        console.log(`  -> Categorized as Multi-chain (${supportedFamilies.join(', ')}) based on chain info`);
      } else {
        allGroupedWallets[supportedFamilies[0]].push({...wallet, families: supportedFamilies});
        console.log(`  -> Categorized as ${supportedFamilies[0]} based on chain info`);
      }
    } else {
      // Wallet doesn't support any of our recognized chains
      console.log(`  -> Skipping wallet ${wallet.info.name} - doesn't support EVM, Solana, or Tron chains`);
    }
  });

  console.log('All grouped wallets:', {
    evm: allGroupedWallets.evm.map(w => w.info.name),
    solana: allGroupedWallets.solana.map(w => w.info.name),
    tron: allGroupedWallets.tron.map(w => w.info.name),
    multiChain: allGroupedWallets.multiChain.map(w => `${w.info.name} (${w.families.join(', ')})`)
  });

  // Add non-MIPD wallets
  if (window.solana) {
    console.log('Phantom/Solana wallet detected in browser');
    // Check if we already have Phantom in multiChain section
    const existingPhantom = allGroupedWallets.multiChain.some(w => w.info.name === 'Phantom');
    if (!existingPhantom) {
      // Add Phantom to multiChain section as it supports both EVM and Solana
      allGroupedWallets.multiChain.push({
        info: {
          name: 'Phantom',
          icon: WALLET_ICONS.phantom,
          rdns: 'phantom'
        },
        families: ['evm', 'solana']
      });
    }
  }

  if (window.tronWeb || window.tronLink) {
    console.log('TronLink/Tron wallet detected in browser');
    const existingTronLink = allGroupedWallets.tron.some(w => w.info.name === 'TronLink');
    if (!existingTronLink) {
      allGroupedWallets.tron.push({
        info: {
          name: 'TronLink',
          icon: WALLET_ICONS.tronlink,
          rdns: 'tronlink'
        },
        families: ['tron']
      });
    }
  }

  // Flatten all wallets into a single array for processing
  const allWallets = [
    ...allGroupedWallets.multiChain,
    ...allGroupedWallets.evm,
    ...allGroupedWallets.solana,
    ...allGroupedWallets.tron
  ];

  // Sort wallets by priority: Phantom, MetaMask, Coinbase Wallet first
  const priorityWallets = ['Phantom', 'MetaMask', 'Coinbase Wallet'];
  allWallets.sort((a, b) => {
    const aPriority = priorityWallets.indexOf(a.info.name);
    const bPriority = priorityWallets.indexOf(b.info.name);
    
    // If both are in priority list, sort by position in priority list
    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority;
    }
    
    // If only a is in priority list, a comes first
    if (aPriority !== -1) {
      return -1;
    }
    
    // If only b is in priority list, b comes first
    if (bPriority !== -1) {
      return 1;
    }
    
    // If neither is in priority list, maintain original order
    return 0;
  });

  console.log('Sorted all wallets:', allWallets.map(w => w.info.name));

  // Split wallets into top 4 and rest
  const topWallets = allWallets.slice(0, 4);
  const remainingWallets = allWallets.slice(4);

  if (allWallets.length === 0) {
    // If no wallets are detected at all, show the "No wallets detected" message
    walletButtonsContainer.innerHTML = '<p class="no-wallets-message">No wallets detected</p>';
  } else {
    // Create container for wallet buttons
    const walletGrid = document.createElement('div');
    walletGrid.className = 'top-wallets-grid';
    
    // Add top 3 wallets as individual buttons
    topWallets.forEach(wallet => {
      const button = createWalletButton(wallet.info.name, wallet.info.icon, wallet.info.rdns);
      
      // Add data attribute for chain features if available
      if (wallet.families && Array.isArray(wallet.families) && wallet.families.length > 0) {
        button.setAttribute('data-chain-features', wallet.families.join(','));
      }
      
      walletGrid.appendChild(button);
    });
    
    walletButtonsContainer.appendChild(walletGrid);

    // Add "View all wallets" button if there are additional wallets
    if (remainingWallets.length > 0) {
      const viewAllButton = document.createElement('button');
      viewAllButton.className = 'view-all-wallets-btn';
      viewAllButton.innerHTML = `View all wallets (<span class="wallet-count">${allWallets.length}</span>) <span class="dropdown-arrow">▼</span>`;
      viewAllButton.setAttribute('data-action', 'click->wallet#toggleAllWallets');
      viewAllButton.setAttribute('aria-expanded', 'false');
      
      walletButtonsContainer.appendChild(viewAllButton);
      
      // Create container for remaining wallets (initially hidden)
      const allWalletsContainer = document.createElement('div');
      allWalletsContainer.className = 'all-wallets-container';
      allWalletsContainer.setAttribute('hidden', '');
      
      // Group remaining wallets by blockchain family for display
      const remainingGroupedWallets = {
        multiChain: [],
        evm: [],
        solana: [],
        tron: []
      };
      
      remainingWallets.forEach(wallet => {
        if (wallet.families.includes('evm') && wallet.families.includes('solana')) {
          remainingGroupedWallets.multiChain.push(wallet);
        } else if (wallet.families.includes('evm')) {
          remainingGroupedWallets.evm.push(wallet);
        } else if (wallet.families.includes('solana')) {
          remainingGroupedWallets.solana.push(wallet);
        } else if (wallet.families.includes('tron')) {
          remainingGroupedWallets.tron.push(wallet);
        }
      });
      
      // Create sections for each blockchain family
      Object.entries(remainingGroupedWallets).forEach(([family, wallets]) => {
        if (wallets.length > 0) {
          const sectionTitle = 
            family === 'multiChain' ? 'Multi-chain' : 
            family === 'evm' ? 'Ethereum & EVM' : 
            family === 'solana' ? 'Solana' : 
            'Tron';
            
          const section = createSectionElement(sectionTitle, family);
          const walletGroup = section.querySelector('.wallet-group');
          
          wallets.forEach(wallet => {
            const button = createWalletButton(wallet.info.name, wallet.info.icon, wallet.info.rdns);
            
            // Add data attribute for chain features if available
            if (wallet.families && Array.isArray(wallet.families) && wallet.families.length > 0) {
              button.setAttribute('data-chain-features', wallet.families.join(','));
            }
            
            walletGroup.appendChild(button);
          });
          
          allWalletsContainer.appendChild(section);
        }
      });
      
      walletButtonsContainer.appendChild(allWalletsContainer);
    }
  }
}

function getWalletFamilies(chains) {
  const families = [];
  
  if (!chains) {
    console.log('No chain info provided for wallet family detection');
    return families;
  }
  
  console.log('Detecting wallet families from chains:', chains);
  
  if (chains.some(chain => chain.startsWith('eip155:'))) {
    console.log('  -> Identified as EVM wallet');
    families.push('evm');
  }
  if (chains.some(chain => chain.startsWith('solana:'))) {
    console.log('  -> Identified as Solana wallet');
    families.push('solana');
  }
  if (chains.some(chain => chain.startsWith('tron:'))) {
    console.log('  -> Identified as Tron wallet');
    families.push('tron');
  }
  
  if (families.length === 0) {
    console.log('  -> Could not identify wallet family from chains');
  }
  
  return families;
}

function createSectionElement(title, family) {
  const section = document.createElement('div');
  section.className = 'wallet-section';
  section.setAttribute('data-family', family);
  
  const header = document.createElement('h3');
  header.className = 'wallet-group-header';
  header.textContent = title;
  
  const group = document.createElement('div');
  group.className = 'wallet-group';
  
  section.appendChild(header);
  section.appendChild(group);
  
  return section;
}

function createWalletSection(container, title, wallets, controller) {
  if (wallets.length === 0) return;
  
  const section = createSectionElement(title, getFamilyFromTitle(title));
  const walletGroup = section.querySelector('.wallet-group');
  
  wallets.forEach(wallet => {
    const button = createWalletButton(wallet.info.name, wallet.info.icon, wallet.info.rdns);
    
    // Add data attribute for chain features if available
    if (wallet.families && Array.isArray(wallet.families) && wallet.families.length > 0) {
      button.setAttribute('data-chain-features', wallet.families.join(','));
    }
    
    walletGroup.appendChild(button);
  });
  
  container.appendChild(section);
}

function getFamilyFromTitle(title) {
  switch(title) {
    case 'Multi-chain': return 'multiChain';
    case 'Ethereum & EVM': return 'evm';
    case 'Solana': return 'solana';
    case 'Tron': return 'tron';
    default: return 'unknown';
  }
}

function createWalletButton(name, icon, rdns) {
  const button = document.createElement('button');
  button.className = 'wallet-button';
  button.setAttribute('data-wallet-rdns', rdns);
  button.setAttribute('data-action', 'click->wallet#selectWallet');

  const img = document.createElement('img');
  img.src = icon;
  img.alt = name;
  img.width = 40;
  img.height = 40;

  const span = document.createElement('span');
  span.textContent = name;

  button.appendChild(img);
  button.appendChild(span);
  return button;
}