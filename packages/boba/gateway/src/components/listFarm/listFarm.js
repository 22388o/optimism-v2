import React from 'react';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';
import { logAmount, powAmount } from 'util/amountConvert';
import { BigNumber } from 'ethers';

import { openAlert, openModal } from 'actions/uiAction';
import { getFarmInfo, updateStakeToken, updateWithdrawToken } from 'actions/farmAction';

import Button from 'components/button/Button';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RemoveIcon from '@mui/icons-material/Remove';

import networkService from 'services/networkService'

import { getCoinImage } from 'util/coinImage';

import { Box, Typography, Fade,  CircularProgress } from '@mui/material';
import * as S from "./ListFarm.styles"
import { getAllAddresses, getReward } from 'actions/networkAction';

class ListFarm extends React.Component {

  constructor(props) {

    super(props)

    const {
      poolInfo,
      userInfo,
      L1orL2Pool,
      balance,
      showAll,
      showStakesOnly,
      accountEnabled,
    } = this.props;

    this.state = {
      balance,
      L1orL2Pool,
      // data
      poolInfo,
      userInfo,
      showAll,
      showStakesOnly,
      //drop down box
      dropDownBox: false,
      dropDownBoxInit: true,
      // loading
      loading: false,
      // provider status
      accountEnabled,
    }

  }

  componentDidMount(){
    this.props.dispatch(getAllAddresses());
  }

  componentDidUpdate(prevState) {

    const { poolInfo, userInfo, balance, showAll, showStakesOnly, accountEnabled } = this.props

    if (!isEqual(prevState.poolInfo, poolInfo)) {
      this.setState({ poolInfo });
    }

    if (!isEqual(prevState.userInfo, userInfo)) {
      this.setState({ userInfo });
    }

    if (!isEqual(prevState.balance, balance)) {
      this.setState({ balance });
    }

    if (!isEqual(prevState.showAll, showAll)) {
      this.setState({ showAll });
    }

    if (!isEqual(prevState.showStakesOnly, showStakesOnly)) {
      this.setState({ showStakesOnly });
    }

    if (prevState.accountEnabled !== accountEnabled) {
      this.setState({ accountEnabled });
    }
  }

  async handleStakeToken() {

    const { poolInfo, L1orL2Pool, balance } = this.state

    const { allAddresses } = this.props.farm

    this.props.dispatch(updateStakeToken({
      symbol: poolInfo.symbol,
      currency: L1orL2Pool === 'L1LP' ? poolInfo.l1TokenAddress : poolInfo.l2TokenAddress,
      LPAddress: L1orL2Pool === 'L1LP' ? allAddresses.L1LPAddress : allAddresses.L2LPAddress,
      L1orL2Pool,
      balance,
      decimals: poolInfo.decimals
    }))

    this.props.dispatch(openModal('farmDepositModal'))
  }

  async handleWithdrawToken() {

    const { poolInfo, L1orL2Pool, balance } = this.state

    const { allAddresses } = this.props.farm

    this.props.dispatch(updateWithdrawToken({
      symbol: poolInfo.symbol,
      currency: L1orL2Pool === 'L1LP' ? poolInfo.l1TokenAddress : poolInfo.l2TokenAddress,
      LPAddress: L1orL2Pool === 'L1LP' ? allAddresses.L1LPAddress : allAddresses.L2LPAddress,
      L1orL2Pool,
      balance,
      decimals: poolInfo.decimals
    }))

    this.props.dispatch(openModal('farmWithdrawModal'))
  }

  async handleHarvest() {

    const { poolInfo, L1orL2Pool, userInfo } = this.state;

    this.setState({ loading: true })

    const userReward = BigNumber.from(userInfo.pendingReward).add(
      BigNumber.from(userInfo.amount)
      .mul(BigNumber.from(poolInfo.accUserRewardPerShare))
      .div(BigNumber.from(powAmount(1, 12)))
      .sub(BigNumber.from(userInfo.rewardDebt))
    ).toString()

    let getRewardTX = await this.props.dispatch(getReward(
      L1orL2Pool === 'L1LP' ? poolInfo.l1TokenAddress : poolInfo.l2TokenAddress,
      userReward,
      L1orL2Pool
    ))

    if (getRewardTX) {
      this.props.dispatch(openAlert(`${logAmount(userReward, poolInfo.decimals, 2)} ${poolInfo.symbol} was added to your account`))
      this.props.dispatch(getFarmInfo())
      this.setState({ loading: false })
    } else {
      this.setState({ loading: false })
    }

  }

  render() {

    const {
      poolInfo, userInfo,
      dropDownBox, showAll, showStakesOnly,
      loading, L1orL2Pool, accountEnabled
    } = this.state;

    const pageLoading = Object.keys(poolInfo).length === 0;

    const { isMobile } = this.props

    let userReward = 0;

    if (Object.keys(userInfo).length && Object.keys(poolInfo).length && accountEnabled) {
      userReward = BigNumber.from(userInfo.pendingReward).add(
        BigNumber.from(userInfo.amount)
        .mul(BigNumber.from(poolInfo.accUserRewardPerShare))
        .div(BigNumber.from(powAmount(1, 12)))
        .sub(BigNumber.from(userInfo.rewardDebt))
      ).toString()
    }

    // L1orL2Pool: L1LP || L2LP
    // networkService.L1OrL2 L1 || L2
    const disabled = !L1orL2Pool.includes(networkService.L1orL2)
    const symbol = poolInfo.symbol
    const name = poolInfo.name
    const decimals = poolInfo.decimals
    let logo = getCoinImage(symbol)

    //Deal with Token migration to REPv2
    if( symbol === 'REPv2' ) {
      logo = getCoinImage('REP')
    }

    if(showAll === false) {
      if(Number(logAmount(poolInfo.tokenBalance, decimals, 2)) > 0.001) {
        return null
      }
    }

    if(showStakesOnly === true) {
      if(Number(logAmount(userInfo.amount, decimals, 2)) < 0.001) {
        return null
      }
    }

    let enableReward = false
    if( Number(logAmount(userReward, decimals, 3)) >= 0.001 ) {
      enableReward = true
    }

    return (
      <S.Wrapper dropDownBox={dropDownBox}>
        {pageLoading ? (
          <Box sx={{textAlign: 'center'}}>
            <CircularProgress color="secondary" />
          </Box>
        ) : (
          <S.GridContainer container
            spacing={2}
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
          >

            {isMobile &&
              <S.GridItemTag item
                xs={12}
                md={2}
              >
                <Typography variant="overline" style={{lineHeight: '1em', fontSize: '1.2em'}}>{symbol}</Typography>
              </S.GridItemTag>
            }

            {!isMobile &&
              <S.GridItemTag item
                xs={4}
                md={2}
                style={{
                  justifyContent: 'flex-start',
                  alignItems:'center',
                }}
              >
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems:'center'}}>
                  <img src={logo} alt="logo" width={35} height={35} />
                  <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems:'flex-start', paddingLeft: '8px'}}>
                    <Typography variant="overline" style={{lineHeight: '1em'}}>{symbol}</Typography>
                    <Typography variant="overline" style={{lineHeight: '1em', color: 'rgba(255, 255, 255, 0.3)'}}>{name}</Typography>
                  </div>
                </div>
              </S.GridItemTag>
            }

            <S.GridItemTag item
              xs={4}
              md={2}
              >
              {isMobile ? (
                <Typography variant="overline" sx={{opacity: 0.7, paddingRight: '5px'}}>Balance</Typography>
              ) : (null)}
              <Typography variant="body1">
                {poolInfo.tokenBalance ?
                  `${Number(logAmount(poolInfo.tokenBalance, decimals, 2)).toLocaleString(undefined, {maximumFractionDigits:2})}` : `0`
                }
              </Typography>
            </S.GridItemTag>

            <S.GridItemTag item
              xs={4}
              md={2}
              >
              {isMobile ? (
                <Typography variant="overline" sx={{opacity: 0.7, paddingRight: '5px'}}>Liquidity</Typography>
              ) : (null)}
              <Typography variant="body1" style={{opacity: '0.4'}}>
                {poolInfo.userDepositAmount ?
                  `${Number(logAmount(poolInfo.userDepositAmount, decimals, 2)).toLocaleString(undefined, {maximumFractionDigits:2})}` : `0`
                }
              </Typography>
            </S.GridItemTag>

            <S.GridItemTag item
              xs={4}
              md={1}
            >
              {isMobile ? (
                <Typography variant="overline" sx={{opacity: 0.7, paddingRight: '5px'}}>APR %</Typography>
              ) : (null)}
              <Typography variant="body1">
                {`${logAmount(poolInfo.APR, 0, 2)}`}
              </Typography>
            </S.GridItemTag>

            <S.GridItemTag item
              xs={4}
              md={1}
            >
              {isMobile ? (
                <Typography variant="overline" sx={{opacity: 0.7, paddingRight: '5px'}}>Your Stake</Typography>
              ) : (null)}
              <Typography variant="body1">
                {accountEnabled ?
                  userInfo.amount ? `${logAmount(userInfo.amount, decimals, 2)}` : `0`
                  : <></>
                }
              </Typography>
            </S.GridItemTag>

            <S.GridItemTag item
              xs={4}
              md={1}
              >
              {isMobile ? (
                <Typography variant="overline" sx={{opacity: 0.7, paddingRight: '5px'}}>Earned</Typography>
              ) : (null)}
              <Typography variant="body1">
              {accountEnabled ?
                userReward ? `${logAmount(userReward, decimals, 5)}` : `0`
                : <></>
              }
              </Typography>
            </S.GridItemTag>

            <S.GridItemTag item
              xs={3}
              md={1}
            >
              <Box
                disabled={disabled}
                onClick={()=>{this.setState({ dropDownBox: !dropDownBox, dropDownBoxInit: false })}}
                sx={{display: 'flex', cursor: 'pointer', color: "#0ebf9a", transform: dropDownBox ? "rotate(-180deg)" : ""}}
              >
                {accountEnabled ? <ExpandMoreIcon/>: <></>}
              </Box>
            </S.GridItemTag>
          </S.GridContainer>
        )}

        {/*********************************************/
        /**************  Drop Down Box ****************/
        /**********************************************/
        }
        {dropDownBox ? (
          <Fade in={dropDownBox}>
            <S.DropdownContent>
              <S.DropdownWrapper>
                <Typography sx={{flex: 1}} variant="body2" component="div">{`${symbol}`} Earned</Typography>
                <Typography sx={{flex: 1}} variant="body2" component="div" color="secondary">{logAmount(userReward, decimals, 5)}</Typography>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={logAmount(userReward, decimals) === '0' || disabled || !enableReward}
                  onClick={()=>{this.handleHarvest()}}
                  loading={loading}
                  sx={{flex: 1}}
                >
                  Harvest
                </Button>
              </S.DropdownWrapper>

              <S.DropdownWrapper>
                {logAmount(userInfo.amount, decimals) === '0' ?
                  <>
                    <Typography sx={{flex: 1}} variant="body2" component="div">{`${symbol}`} Staked</Typography>
                    <Typography sx={{flex: 1}} variant="body2" component="div" color="secondary">0.00</Typography>
                    <Button
                      variant="contained"
                      onClick={() => {this.handleStakeToken()}}
                      disabled={disabled}
                      fullWidth
                      sx={{flex: 1}}
                    >
                      Stake
                    </Button>
                  </> :
                  <>
                    <Typography variant="body2" component="div">{`${symbol}`} Staked</Typography>
                    <Typography variant="body2" component="div" color="secondary">{logAmount(userInfo.amount, decimals, 2)}</Typography>
                    <Box sx={{display: "flex", alignItems: "center", gap: "5px"}}>
                      <Button
                        variant="outlined"
                        color="neutral"
                        onClick={() => {!disabled && this.handleWithdrawToken()}}
                      >
                        <RemoveIcon/>
                      </Button>
                      <Button variant="contained" onClick={() => {!disabled && this.handleStakeToken()}}>
                        Stake More
                      </Button>
                    </Box>
                  </>
                }
              </S.DropdownWrapper>
            </S.DropdownContent>
          </Fade>
        ) : null }

      </S.Wrapper>
    )
  }
}

const mapStateToProps = state => ({
    farm: state.farm,
})

export default connect(mapStateToProps)(ListFarm)
