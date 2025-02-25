/*
Copyright 2019-present OmiseGO Pte Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

require('dotenv').config()

let justSwitchedChain = localStorage.getItem("justSwitchedChain")

if (justSwitchedChain) {
  justSwitchedChain = JSON.parse(justSwitchedChain)
}

const initialState = {
  accountEnabled: null,
  baseEnabled: null,
  netLayer: null,
  accountNumber: null,
  network: process.env.REACT_APP_CHAIN,
  justSwitchedChain: justSwitchedChain ? justSwitchedChain : false,
}

function setupReducer (state = initialState, action) {
  switch (action.type) {
    case 'SETUP/ACCOUNT/SET':
      localStorage.setItem("justSwitchedChain", JSON.stringify(false))
      return { 
        ...state, 
        accountEnabled: action.payload,
        justSwitchedChain: false
      }
    case 'SETUP/ACCOUNT_NUMBER/SET':
      return { 
        ...state, 
        accountNumber: action.payload,
      }
    case 'SETUP/BASE/SET':
      return { 
        ...state, 
        baseEnabled: action.payload,
      }
    case 'SETUP/LAYER/SET':
      return { 
        ...state, 
        netLayer: action.payload
      }
    case 'SETUP/NETWORK/SET':
      return { 
        ...state, 
        network: action.payload
      }
    case 'SETUP/SWITCH/SUCCESS':
      console.log("SR - setting just changed to true")
      localStorage.setItem("justSwitchedChain", JSON.stringify(true))
      return { 
        ...state, 
        justSwitchedChain: true
      }
    default:
      return state
  }
}

export default setupReducer
