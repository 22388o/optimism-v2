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

import React,{useState,useEffect,useCallback} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { isEqual, orderBy } from 'lodash'

//Selectors
import { selectAccountEnabled, selectBaseEnabled, selectLayer } from 'selectors/setupSelector'
import { selectlayer2Balance, selectlayer1Balance } from 'selectors/balanceSelector'
import { selectTransactions } from 'selectors/transactionSelector'
import { selectTokens } from 'selectors/tokenSelector'
import { selectLoading } from 'selectors/loadingSelector'

import ListAccount from 'components/listAccount/listAccount'
import ListAccountBatch from 'components/listAccount/listAccountBatch'

import * as S from './Account.styles'

import PageHeader from 'components/pageHeader/PageHeader'
import { Box, Grid, Tab, Tabs, Typography, useMediaQuery } from '@mui/material'
import { fetchLookUpPrice, fetchTransactions, fetchBalances } from 'actions/networkAction'
import { selectNetwork } from 'selectors/setupSelector'
import { useTheme } from '@emotion/react'
import { tableHeadList } from './tableHeadList'

import TabPanel from 'components/tabs/TabPanel'

import NetworkSwitcherIcon from 'components/icons/NetworkSwitcherIcon'

import PendingTransaction from './PendingTransaction'
import useInterval from 'util/useInterval'

import { POLL_INTERVAL } from 'util/constant'

function Account ({ enabled }) {

  const dispatch = useDispatch()

  const accountEnabled = useSelector(selectAccountEnabled())
  const baseEnabled = useSelector(selectBaseEnabled())
  const networkLayer = useSelector(selectLayer())
  const network = useSelector(selectNetwork())
  
  console.log("Account - network:", network)
  console.log("Account - layer:", networkLayer)
  console.log("Account - baseEnabled:", baseEnabled)
  console.log("Account - accountEnabled:", accountEnabled)

  const [ activeTab, setActiveTab ] = useState(networkLayer === 'L1' ? 0 : 1)

  const childBalance = useSelector(selectlayer2Balance, isEqual)
  const rootBalance = useSelector(selectlayer1Balance, isEqual)

  const tokenList = useSelector(selectTokens)

  const depositLoading = useSelector(selectLoading(['DEPOSIT/CREATE']))
  const exitLoading = useSelector(selectLoading(['EXIT/CREATE']))

  const disabled = depositLoading || exitLoading

  const getLookupPrice = useCallback(()=>{
    if (!accountEnabled) return
    const symbolList = Object.values(tokenList).map((i)=> {
      if(i.symbolL1 === 'ETH') {
        return 'ethereum'
      } else if(i.symbolL1 === 'OMG') {
        return 'omg'
      } else {
        return i.symbolL1.toLowerCase()
      }
    })
    dispatch(fetchLookUpPrice(symbolList))
  },[ tokenList, dispatch, accountEnabled ])

  const unorderedTransactions = useSelector(selectTransactions, isEqual)

  const orderedTransactions = orderBy(unorderedTransactions, i => i.timeStamp, 'desc')

  const pendingL1 = orderedTransactions.filter((i) => {
      if (i.chain === 'L1pending' && //use the custom API watcher for fast data on pending L1->L2 TXs
          i.crossDomainMessage &&
          i.crossDomainMessage.crossDomainMessage === 1 &&
          i.crossDomainMessage.crossDomainMessageFinalize === 0 &&
          i.action.status === "pending"
      ) {
          return true
      }
      return false
  })

  const pendingL2 = orderedTransactions.filter((i) => {
      if (i.chain === 'L2' &&
          i.crossDomainMessage &&
          i.crossDomainMessage.crossDomainMessage === 1 &&
          i.crossDomainMessage.crossDomainMessageFinalize === 0 &&
          i.action.status === "pending"
      ) {
          return true
      }
      return false
  })

  const pending = [
    ...pendingL1,
    ...pendingL2
  ]

  useEffect(()=>{
    if (!accountEnabled) return
    getLookupPrice()
  },[ childBalance, rootBalance, getLookupPrice, accountEnabled ])

  useEffect(()=>{
    if (accountEnabled) {
      console.log("Account - initial check balances")
      dispatch(fetchTransactions())
      dispatch(fetchBalances())
    }
  },[ dispatch, accountEnabled ])

  useInterval(() => {
    if (accountEnabled) {
      console.log("Account - checking balances")
      dispatch(fetchTransactions())
      dispatch(fetchBalances())
    }
  }, POLL_INTERVAL)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const ActiveItem = ({active}) => (
    <Box display="flex" sx={{ justifyContent: 'center', gap: 1 }}>
      <NetworkSwitcherIcon active={active} /> <Typography variant="overline">Active</Typography>
    </Box>
  )

  let label_L1 = 'Your Balance on Ethereum'
  if (network === 'rinkeby') label_L1 = 'Rinkeby'

  let label_L2 = 'Your Balance on Boba'
  if (network === 'rinkeby') label_L2 = 'Boba'

  const L1Column = () => (
    <S.AccountWrapper >
      {!isMobile ? (
        <S.WrapperHeading>
          <Typography variant="h3" sx={{opacity: networkLayer === 'L1' ? "1.0" : "0.2", fontWeight: "700"}}>{label_L1}</Typography>
          {networkLayer === 'L1' ? <ActiveItem active={true} /> : null}
        </S.WrapperHeading>
        ) : (null)
      }
      <S.TableHeading>
        {tableHeadList.map((item) => {
          return (
            <S.TableHeadingItem key={item.label} variant="body2" component="div" sx={{opacity: networkLayer === 'L1' ? "1.0" : "0.2"}}>
              {item.label}
            </S.TableHeadingItem>
          )
        })}
      </S.TableHeading>
      <Box>
        <ListAccountBatch
          chain={'L1'}
          networkLayer={networkLayer}
          disabled={disabled}
          accountEnabled={accountEnabled}
        />
        {rootBalance.map((i, index) => {
          return (
            <ListAccount
              key={i.currency}
              token={i}
              chain={'L1'}
              networkLayer={networkLayer}
              disabled={disabled}
            />
          )
        })}
      </Box>
    </S.AccountWrapper>
  )

  const L2Column = () => (
    <S.AccountWrapper>
      {!isMobile ? (
        <S.WrapperHeading>
          <Typography variant="h3" sx={{opacity: networkLayer === 'L2' ? "1.0" : "0.4", fontWeight: "700"}}>{label_L2}</Typography>
          {networkLayer === 'L2' ? <ActiveItem active={true} /> : null}
        </S.WrapperHeading>
        ) : (null)
      }
      <S.TableHeading sx={{opacity: networkLayer === 'L2' ? "1.0" : "0.4"}}>
        {tableHeadList.map((item) => {
          return (
            <S.TableHeadingItem key={item.label} variant="body2" component="div">{item.label}</S.TableHeadingItem>
          )
        })}
      </S.TableHeading>
      <Box>
        {childBalance.map((i, index) => {
          return (
            <ListAccount
              key={i.currency}
              token={i}
              chain={'L2'}
              networkLayer={networkLayer}
              disabled={disabled}
            />
          )
        })}
      </Box>
    </S.AccountWrapper>
  )

  return (
    <>
      <PageHeader title="Bridge"/>

      {disabled &&
        <S.LayerAlert style={{border: 'solid 1px yellow'}}>
          <S.AlertInfo>
            <S.AlertText
              variant="body2"
              component="p"
            >
              Transaction in progress - please be patient
            </S.AlertText>
          </S.AlertInfo>
        </S.LayerAlert>
      }

      {pending.length > 0 &&
        <Grid sx={{margin: '10px 0px'}}>
          <Grid item xs={12}>
            <PendingTransaction />
          </Grid>
        </Grid>
      }
      {isMobile ? (
        <>
          <Tabs value={activeTab} onChange={handleChange} sx={{color: '#fff', fontWeight: 700, my: 2}}>
            <Tab label={label_L1} />
            <Tab label={label_L2} />
          </Tabs>
          <TabPanel value={activeTab} index={0}>
            <L1Column />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <L2Column />
          </TabPanel>
        </>
      ) : (
        <Grid container spacing={2} >
          <Grid item xs={12} md={6} >
            <L1Column />
          </Grid>
          <Grid item xs={12} md={6}>
            <L2Column />
          </Grid>
        </Grid>
      )}
    </>
  );

}

export default React.memo(Account)
