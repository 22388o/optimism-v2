#!/usr/bin/env node

const configs = require('../services/utilities/configs')
const { sleep } = require('@eth-optimism/core-utils')
const { logger } = require('../services/utilities/logger')

const loop = async (func) => {
  while (true) {
    try {
      await func()
    } catch (error) {
      console.log('Unhandled exception during monitor service', {
        message: error.toString(),
        stack: error.stack,
        code: error.code,
      })
      await sleep(1000)
    }
  }
}

const loopLogTx = async () => {
  const ResponseTimeService = require('../services/responseTime.service')
  const responseTimeService = new ResponseTimeService()

  while (true) {
    await responseTimeService.logResponseTime()
    await sleep(5000)
  }
}

const main = async () => {
  if (configs.enableTxResponseTime) {
    loopLogTx()
  }

  const {
    setupProvider,
    validateMonitoring,
  } = require('../services/monitoring')

  if (validateMonitoring()) {
    logger.info('Start addresses monitoring service!')
    setupProvider(configs.OMGXNetwork.L1, configs.l1WsUrl)
    setupProvider(configs.OMGXNetwork.L2, configs.l2WsUrl)
  } else {
    logger.error(
      'Addresses Monitoring: Env variables for monitoring is missing!'
    )
  }

  const BlockMonitorService = require('../services/blockMonitor')
  const stateRootMonitorService = require('../services/stateRootMonitor')
  const exitMonitorService = require('../services/exitMonitor')
  const l1BridgeMonitorService = require('../services/l1BridgeMonitor')
  const messageMonitorService = require('../services/messageMonitor')

  // l1 message monitor
  const messageService = new messageMonitorService()
  await messageService.initConnection()

  loop(() => messageService.startMessageMonitor())

  // l1 bridge monitor
  const l1BridgeService = new l1BridgeMonitorService()
  await l1BridgeService.initConnection()

  loop(() => l1BridgeService.startL1BridgeMonitor())
  loop(() => l1BridgeService.startCrossDomainMessageMonitor())

  // liquidity pool
  const exitService = new exitMonitorService()
  await exitService.initConnection()

  loop(() => exitService.startExitMonitor())

  // state root
  const stateRootService = new stateRootMonitorService()
  await stateRootService.initConnection()

  loop(() => stateRootService.startStateRootMonitor())

  // block
  const blockService = new BlockMonitorService()
  await blockService.initConnection()
  await blockService.initScan()

  loop(() => blockService.startTransactionMonitor())
  loop(() => blockService.startCrossDomainMessageMonitor())
}

;(async () => {
  main()
})().catch((err) => {
  console.log(err)
  process.exit(1)
})
