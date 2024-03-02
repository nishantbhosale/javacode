 select  
    tradeIn.partyAccount                                         AS inputID,
    CASE WHEN tradeIn.direction='BUY'  THEN tradeIn.quantity END AS bQty,
    CASE WHEN tradeIn.direction='SELL' THEN tradeIn.quantity END AS sQty,
    shortListedTrade.businessDate,
    CASE
        WHEN product.PRODUCTTYPE = 'FUTURE'
        THEN ((CASE WHEN tradein.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(tradein.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') )
        ELSE ((CASE WHEN tradein.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(tradein.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') || ' ' || COALESCE(instrument.STRIKEPRICE,0.0) || ' ' || COALESCE(instrument.OPTIONTYPE,''))
    END as contractDescription,
    shortListedTrade.LEGEND as LEGEND,
    shortListedTrade.CURRENCYCODE                                as tradePriceCurCode,
    regcat.NAME                                                  as optionPremiumRegCategory,
    shortListedTrade.costOrProceeds                              as costOrProceeds,
    tradein.trdTypes                                             as trdTypes
    from
    (
select
            eligibleTradeWithCostOrProceeds.id,
            eligibleTradeWithCostOrProceeds.STARTDATE,
            eligibleTradeWithCostOrProceeds.TENANT,
            eligibleTradeWithCostOrProceeds.CURRENCYCODE,
            sum(eligibleTradeWithCostOrProceeds.costOrProceeds) as costOrProceeds,
            (eligibleTradeWithCostOrProceeds.LEGEND) as LEGEND,
            max(eligibleTradeWithCostOrProceeds.BUSINESSDATE) as BUSINESSDATE
        from
        (

            SELECT
                eligibleTrade.ID,
                eligibleTrade.STARTDATE,
                eligibleTrade.TENANT,
                DMCF.AMOUNT * eligibleTrade.mulFactor as costOrProceeds,
                (DMCF.CURRENCYCODE) as CURRENCYCODE,
                (businessDate) as businessDate,
                case when mulFactor = '1' then 'Cancel' else 'Trade' End as Legend
                from
                (
                            select trade.id, trade.STARTDATE, trade.TENANT, -1 as mulFactor, trade.CLEARINGDATE as businessDate
                            from 
                            DM_DAILYHISTORY_TRADE trade
                        
                            where
                                     trade.CLEARINGDATE  between :fromDate and :toDate
                                and  trade.partyAccount  in( :inputIDs)
                                and  trade.STARTDATE     <=        trade.CLEARINGDATE
                                and  trade.ENDDATE       >=        trade.CLEARINGDATE
                                and  trade.CLEARINGSTATUS  =        'CLEARED'
                                and (trade.ENDACTION is null or trade.ENDACTION !='DELETE')
                                
                            UNION

                            select trade.id, trade.STARTDATE, trade.TENANT, -1 as mulFactor, trade.ENTITYBUSINESSDATE as businessDate
                            from 
                            DM_DAILYHISTORY_TRADE trade

                            where   trade.STARTDATE      between :fromDate and :toDate
                                and trade.partyAccount  in( :inputIDs)
                                and trade.CLEARINGDATE   <         trade.STARTDATE
                                and trade.ENDDATE        >=        trade.STARTDATE
                                and trade.STARTDATE      =         trade.ENTITYBUSINESSDATE
                                and trade.CLEARINGSTATUS =         'CLEARED'
                                and (trade.ENDACTION is null or trade.ENDACTION !='DELETE')
                                

                            UNION

                           
                            select trade.id, trade.STARTDATE, trade.TENANT, -1 as mulFactor, trade.STARTDATE as businessDate
                            from 
                            DM_DAILYHISTORY_TRADE trade

                            JOIN DM_COMMISSIONFEE_HISTORY cf
                                on  cf.ENTITYID            = trade.id
                                and cf.ROOTCAUSEENTITYTYPE = 'Trade'
                                and cf.startdate           = trade.STARTDATE
                                and cf.enddate             > trade.startdate
                                and cf.TENANT              = trade.TENANT

                            Where                        
                                    trade.STARTDATE        between :fromDate and :toDate
                                and trade.partyAccount  in( :inputIDs)
                                and trade.CLEARINGDATE     <         trade.STARTDATE
                                and trade.STARTDATE        >         trade.ENTITYBUSINESSDATE
                                and trade.ENDDATE          >=        trade.STARTDATE
                                and trade.CLEARINGSTATUS   =         'CLEARED'
                                and (trade.ENDACTION is null or trade.ENDACTION !='DELETE')


                            group by trade.id, trade.STARTDATE, trade.TENANT


                            UNION
                            

                            select historyTrade.ID, historyTrade.STARTDATE, historyTrade.TENANT, 1 as mulFactor, tradeDeletedEvent.ENTITYBUSINESSDATE as businessDate
                            from
                            dm_tradedeletedevent tradeDeletedEvent
        
                            JOIN DM_DAILYHISTORY_TRADE historyTrade
                                 on tradeDeletedEvent.ENTITYBUSINESSDATE     between :fromDate and :toDate
                                and historyTrade.partyAccount  in( :inputIDs)
                                and tradeDeletedEvent.trade                  =   historyTrade.id
                                and tradeDeletedEvent.TENANT                 =   historyTrade.TENANT
                                and tradeDeletedEvent.ENTITYBUSINESSDATE - INTERVAL '1' DAY     =   historyTrade.ENDDATE 


                            UNION

                            select yesterdaysTrade.ID, yesterdaysTrade.STARTDATE, yesterdaysTrade.TENANT, 1 as mulFactor, todaysTrade.ENTITYBUSINESSDATE as businessDate
                            from
                           ( select ID, startdate, ENDDATE, entitybusinessdate, TENANT from DM_DAILYHISTORY_TRADE trade
                                where
                                     trade.STARTDATE   between :fromDate and :toDate
                                 AND trade.CLEARINGDATE       < trade.STARTDATE
                            ) todaysTrade
                                 
                            JOIN 
                            
                            ( select ID, startdate,ENDDATE, entitybusinessdate, TENANT from DM_DAILYHISTORY_TRADE historyTrade
                                where
                                     historyTrade.ENDDATE   between :fromDate - 1 and :toDate - 1 
                                 AND  historyTrade.partyAccount  in( :inputIDs)
                            ) yesterdaysTrade 
                            
                            on  todaysTrade.ID = yesterdaysTrade.ID
                            and todaysTrade.TENANT = yesterdaysTrade.TENANT
                            and yesterdaysTrade.ENDDATE = todaysTrade.STARTDATE -1 
                            and yesterdaysTrade.ENTITYBUSINESSDATE < todaysTrade.ENTITYBUSINESSDATE



                            UNION


                            select yesterdaysTrade.ID, yesterdaysTrade.STARTDATE, yesterdaysTrade.TENANT, 1 as mulFactor, max(todaysTrade.STARTDATE) as businessDate
                            from
                           ( select ID, startdate, ENDDATE, entitybusinessdate, TENANT from DM_DAILYHISTORY_TRADE trade
                                where
                                     trade.STARTDATE   between :fromDate and :toDate
                                 AND trade.CLEARINGDATE       < trade.STARTDATE
                            ) todaysTrade
                                 
                            JOIN 
                            
                            ( select ID, startdate,ENDDATE, entitybusinessdate, TENANT from DM_DAILYHISTORY_TRADE historyTrade
                                where
                                     historyTrade.ENDDATE   between :fromDate - 1 and :toDate - 1 
                                 AND  historyTrade.partyAccount  in( :inputIDs)
                            ) yesterdaysTrade 
                            
                            on  todaysTrade.ID = yesterdaysTrade.ID
                            and todaysTrade.TENANT = yesterdaysTrade.TENANT
                            and yesterdaysTrade.ENDDATE = todaysTrade.STARTDATE -1 
                            and yesterdaysTrade.ENTITYBUSINESSDATE = todaysTrade.ENTITYBUSINESSDATE


                            JOIN DM_COMMISSIONFEE_HISTORY cf
                                 on  cf.ENTITYID            = todaysTrade.ID
                                 and cf.ROOTCAUSEENTITYTYPE = 'Trade'
                                 and cf.STARTDATE           = todaysTrade.STARTDATE
                                 and cf.enddate             > todaysTrade.startdate
                                 and cf.TENANT              = todaysTrade.TENANT

                            group by yesterdaysTrade.ID, yesterdaysTrade.STARTDATE, yesterdaysTrade.TENANT


                        )eligibleTrade
                        
                        JOIN DM_COMMISSIONFEE_HISTORY DMCF
                            ON  DMCF.ENTITYID              = eligibleTrade.ID
                            AND DMCF.STARTDATE            <= eligibleTrade.STARTDATE
                            AND (
                                     DMCF.ENDDATE IS NULL
                                     OR DMCF.ENDDATE > eligibleTrade.STARTDATE
                                )
                            AND DMCF.TENANT                =  eligibleTrade.TENANT
                            AND DMCF.ROOTCAUSEENTITYTYPE   = 'Trade'

        UNION ALL

                    SELECT
                        eligibleTrade.ID,
                        eligibleTrade.STARTDATE,
                        eligibleTrade.TENANT,
                        valuation.value * mulFactor  as costOrProceeds,
                        (currency.CODE) as CURRENCYCODE,
                        (businessDate) as businessDate,
                        case when mulFactor = '-1' then 'Cancel' else 'Trade' End as Legend
                        from
                        (
                                    select trade.id, trade.STARTDATE, trade.TENANT, 1 as mulFactor, trade.CLEARINGDATE as businessDate, trade.instrument
                                    from 
                                    DM_DAILYHISTORY_TRADE trade
                                
                                    where
                                             trade.CLEARINGDATE  between :fromDate and :toDate
                                        and  trade.partyAccount  in( :inputIDs)
                                        and  trade.STARTDATE     <=        trade.CLEARINGDATE
                                        and  trade.ENDDATE       >=        trade.CLEARINGDATE
                                        and  trade.CLEARINGSTATUS  =        'CLEARED'
                                        and (trade.ENDACTION is null or trade.ENDACTION !='DELETE')
                                        
                                    UNION

                                    select trade.id, trade.STARTDATE, trade.TENANT, 1 as mulFactor, trade.ENTITYBUSINESSDATE as businessDate, trade.instrument
                                    from 
                                    DM_DAILYHISTORY_TRADE trade

                                    where   trade.STARTDATE      between :fromDate and :toDate
                                        and trade.partyAccount  in( :inputIDs)
                                        and trade.CLEARINGDATE   <         trade.STARTDATE
                                        and trade.ENDDATE        >=        trade.STARTDATE
                                        and trade.STARTDATE      =         trade.ENTITYBUSINESSDATE
                                        and trade.CLEARINGSTATUS =         'CLEARED'
                                        and (trade.ENDACTION is null or trade.ENDACTION !='DELETE')
                                        

                                    UNION

                                   
                                    select trade.id, trade.STARTDATE, trade.TENANT, 1 as mulFactor, trade.STARTDATE as businessDate, max(trade.instrument) as instrument
                                    from 
                                    DM_DAILYHISTORY_TRADE trade

                                    JOIN DM_COMMISSIONFEE_HISTORY cf
                                        on  cf.ENTITYID            = trade.id
                                        and cf.ROOTCAUSEENTITYTYPE = 'Trade'
                                        and cf.startdate           = trade.STARTDATE
                                        and cf.enddate             > trade.startdate
                                        and cf.TENANT              = trade.TENANT

                                    Where                        
                                            trade.STARTDATE        between :fromDate and :toDate
                                        and trade.partyAccount  in( :inputIDs)
                                        and trade.CLEARINGDATE     <         trade.STARTDATE
                                        and trade.STARTDATE        >         trade.ENTITYBUSINESSDATE
                                        and trade.ENDDATE          >=        trade.STARTDATE
                                        and trade.CLEARINGSTATUS   =         'CLEARED'
                                        and (trade.ENDACTION is null or trade.ENDACTION !='DELETE')


                                    group by trade.id, trade.STARTDATE, trade.TENANT


                                    UNION
                                    

                                    select historyTrade.ID, historyTrade.STARTDATE, historyTrade.TENANT, -1 as mulFactor, tradeDeletedEvent.ENTITYBUSINESSDATE as businessDate, historyTrade.instrument
                                    from
                                    dm_tradedeletedevent tradeDeletedEvent
                
                                    JOIN DM_DAILYHISTORY_TRADE historyTrade
                                         on tradeDeletedEvent.ENTITYBUSINESSDATE     between :fromDate and :toDate
                                        and historyTrade.partyAccount  in( :inputIDs) 
                                        and tradeDeletedEvent.trade                  =   historyTrade.id
                                        and tradeDeletedEvent.TENANT                 =   historyTrade.TENANT
                                        and tradeDeletedEvent.ENTITYBUSINESSDATE - INTERVAL '1' DAY     =   historyTrade.ENDDATE 


                                    UNION

                                    select yesterdaysTrade.ID, yesterdaysTrade.STARTDATE, yesterdaysTrade.TENANT, 1 as mulFactor, todaysTrade.ENTITYBUSINESSDATE as businessDate, yesterdaysTrade.instrument
                                    from
                                   ( select ID, startdate, ENDDATE, entitybusinessdate, TENANT, trade.instrument from DM_DAILYHISTORY_TRADE trade
                                        where
                                             trade.STARTDATE   between :fromDate and :toDate
                                         AND trade.CLEARINGDATE       < trade.STARTDATE
                                    ) todaysTrade
                                         
                                    JOIN 
                                    
                                    ( select ID, startdate,ENDDATE, entitybusinessdate, TENANT, historyTrade.instrument  from DM_DAILYHISTORY_TRADE historyTrade
                                        where
                                             historyTrade.ENDDATE   between :fromDate - 1 and :toDate - 1 
                                         AND  historyTrade.partyAccount  in( :inputIDs)
                                    ) yesterdaysTrade 
                                    
                                    on  todaysTrade.ID = yesterdaysTrade.ID
                                    and todaysTrade.TENANT = yesterdaysTrade.TENANT
                                    and yesterdaysTrade.ENDDATE = todaysTrade.STARTDATE -1 
                                    and yesterdaysTrade.ENTITYBUSINESSDATE < todaysTrade.ENTITYBUSINESSDATE



                                    UNION


                                    select yesterdaysTrade.ID, yesterdaysTrade.STARTDATE, yesterdaysTrade.TENANT, 1 as mulFactor, max(todaysTrade.STARTDATE) as businessDate, max(yesterdaysTrade.instrument) as instrument
                                    from
                                   ( select ID, startdate, ENDDATE, entitybusinessdate, TENANT, instrument from DM_DAILYHISTORY_TRADE trade
                                        where
                                             trade.STARTDATE   between :fromDate and :toDate
                                         AND trade.CLEARINGDATE       < trade.STARTDATE
                                    ) todaysTrade
                                         
                                    JOIN 
                                    
                                    ( select ID, startdate,ENDDATE, entitybusinessdate, TENANT, instrument from DM_DAILYHISTORY_TRADE historyTrade
                                        where
                                             historyTrade.ENDDATE   between :fromDate - 1 and :toDate - 1 
                                         AND  historyTrade.partyAccount  in( :inputIDs)
                                    ) yesterdaysTrade 
                                    
                                    on  todaysTrade.ID = yesterdaysTrade.ID
                                    and todaysTrade.TENANT = yesterdaysTrade.TENANT
                                    and yesterdaysTrade.ENDDATE = todaysTrade.STARTDATE -1 
                                    and yesterdaysTrade.ENTITYBUSINESSDATE = todaysTrade.ENTITYBUSINESSDATE


                                    JOIN DM_COMMISSIONFEE_HISTORY cf
                                         on  cf.ENTITYID            = todaysTrade.ID
                                         and cf.ROOTCAUSEENTITYTYPE = 'Trade'
                                         and cf.STARTDATE           = todaysTrade.STARTDATE
                                         and cf.enddate             > todaysTrade.startdate
                                         and cf.TENANT              = todaysTrade.TENANT

                                    group by yesterdaysTrade.ID, yesterdaysTrade.STARTDATE, yesterdaysTrade.TENANT


                                )eligibleTrade
                                 JOIN DM_INSTRUMENT instrument ON instrument.tenant = eligibleTrade.tenant AND instrument.ID = eligibleTrade.INSTRUMENT

                                JOIN DM_PRODUCT product ON product.tenant = eligibleTrade.tenant AND product.ID = instrument.PRODUCTID
                                
                                JOIN DM_CURRENCY currency ON currency.tenant = eligibleTrade.tenant AND currency.ID = product.TRADEPRICECURRENCY
                
                                LEFT JOIN DM_VALUATION valuation
                                    ON  valuation.TRADEID =  eligibleTrade.ID
                                    and valuation.STARTDATE <= eligibleTrade.STARTDATE AND valuation.ENDDATE > eligibleTrade.STARTDATE
                                    AND valuation.VALUATIONMETHODTYPE = 'PREMIUM'
                                    AND valuation.TENANT = eligibleTrade.tenant
                                    and product.OPTIONSETTLEMENTMETHOD = 'PREMIUM'
            ) eligibleTradeWithCostOrProceeds
        group by
                eligibleTradeWithCostOrProceeds.id,
                eligibleTradeWithCostOrProceeds.STARTDATE,
                eligibleTradeWithCostOrProceeds.TENANT,
                eligibleTradeWithCostOrProceeds.LEGEND,
                eligibleTradeWithCostOrProceeds.CURRENCYCODE
        ) shortListedTrade
        join DM_DAILYHISTORY_TRADE tradein
            on  tradein.id        = shortListedTrade.id
            AND tradein.STARTDATE = shortListedTrade.STARTDATE
            AND tradein.TENANT    = shortListedTrade.TENANT

        JOIN DM_REGULATORYCATEGORY regcat ON regcat.tenant = tradein.tenant AND regcat.ID = tradein.REGULATORYCATEGORY

        JOIN DM_INSTRUMENT instrument ON instrument.tenant = tradein.tenant AND instrument.ID = tradein.INSTRUMENT

        JOIN DM_PRODUCT product ON product.tenant = tradein.tenant AND product.ID = instrument.PRODUCTID
                

UNION ALL

 select  
    tradeIn.partyAccount                                         AS inputID,
    CASE WHEN tradeIn.direction='BUY'  THEN shortListedOPR.quantity END AS bQty,
    CASE WHEN tradeIn.direction='SELL' THEN shortListedOPR.quantity END AS sQty,
    shortListedOPR.SHOWBUSINESSDATE                                     AS businessDate,
    CASE
        WHEN product.PRODUCTTYPE = 'FUTURE'
        THEN ((CASE WHEN tradein.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(tradeIn.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') )
        ELSE ((CASE WHEN tradein.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(tradein.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') || ' ' || COALESCE(instrument.STRIKEPRICE,0.0) || ' ' || COALESCE(instrument.OPTIONTYPE,''))
    END as contractDescription,
    shortListedOPR.LEGEND as LEGEND,
    shortListedOPR.CURRENCYCODE                                  as tradePriceCurCode,
    regcat.NAME                                                  as optionPremiumRegCategory,
    shortListedOPR.costOrProceeds                                as costOrProceeds,
    tradein.trdTypes                                             as trdTypes
    from
    (

        select            eligibleOPRWithCostOrProceeds.ID,
                          MAX(eligibleOPRWithCostOrProceeds.tradeID) as tradeID,
                          MAX(eligibleOPRWithCostOrProceeds.QUANTITY) as QUANTITY,
                          eligibleOPRWithCostOrProceeds.BUSINESSDATE,
                          eligibleOPRWithCostOrProceeds.TENANT,
                          eligibleOPRWithCostOrProceeds.Legend,
                          eligibleOPRWithCostOrProceeds.currencycode,
                          sum(eligibleOPRWithCostOrProceeds.costOrProceeds) as costOrProceeds,
                          max(eligibleOPRWithCostOrProceeds.SHOWBUSINESSDATE) as SHOWBUSINESSDATE
                          from 
        (
          SELECT
                    eligibleOPRwithTrade.tradeID      as tradeID,
                    eligibleOPRwithTrade.Quantity      as Quantity,
                    eligibleOPRwithTrade.ID,
                    eligibleOPRwithTrade.BUSINESSDATE,
                    eligibleOPRwithTrade.TENANT,
                    DMCF.AMOUNT * eligibleOPRwithTrade.mulFactor as costOrProceeds,
                    mulFactor,
                    (DMCF.CURRENCYCODE) as CURRENCYCODE,
                    case when mulFactor = '1' then 'Rv Ex/Assn'
                         when mulFactor = '-1' and eligibleOPRwithTrade.ACTION in ('EXERCISE','ASSIGNMENT') then 'Exer/Assn'
                         else 'Expiry' End as Legend,
                    (showBusinessDate) as showBusinessDate

                FROM
                        (
                            SELECT
                            optionProcessingResult.QUANTITY,
                            optionProcessingResult.ID, 
                            optionProcessingResult.BUSINESSDATE,
                            optionProcessingResult.BUSINESSDATE as showBusinessDate,
                            optionProcessingResult.TENANT,
                            optionProcessingResult.price,
                            optionProcessingResult.realizedPnl,
                            optionProcessingResult.ACTION,
                            trade.ID as tradeId,
                            -1 AS mulFactor

                            FROM  DM_OPTIONPROCESSINGRESULT optionProcessingResult
                        
                            JOIN DM_DAILYHISTORY_TRADE trade
                                ON  trade.ID            =   optionProcessingResult.TRADE
                                AND trade.STARTDATE     =   optionProcessingResult.BUSINESSDATE
                                AND trade.TENANT        =   optionProcessingResult.TENANT
                                AND trade.partyAccount  in (:inputIDs)
                                AND optionProcessingResult.BUSINESSDATE   between :fromDate and :toDate
                                AND (
                                        optionProcessingResult.CANCELLATIONDATE     IS NULL 
                                    OR  optionProcessingResult.CANCELLATIONDATE     >   optionProcessingResult.BUSINESSDATE
                                    )
                                AND optionProcessingResult.ACTION           IN    
                                      ( 'EXERCISE', 'ASSIGNMENT', 'ABANDONMENT', 'NON ASSIGNMENT', 'NON_ASSIGNMENT' )
                            
                            UNION
                            
                            SELECT
                            optionProcessingResult.QUANTITY,
                            optionProcessingResult.ID,
                            optionProcessingResult.BUSINESSDATE,
                            optionProcessingResult.CANCELLATIONDATE as showBusinessDate,
                            optionProcessingResult.TENANT,
                            optionProcessingResult.price,
                            optionProcessingResult.realizedPnl,
                            optionProcessingResult.ACTION,
                            trade.ID as tradeId,
                            1 AS mulFactor

                            FROM  DM_OPTIONPROCESSINGRESULT optionProcessingResult
                            
                            JOIN DM_DAILYHISTORY_TRADE trade
                                ON  trade.ID            =   optionProcessingResult.TRADE
                                AND trade.STARTDATE     =   optionProcessingResult.BUSINESSDATE
                                AND trade.TENANT        =   optionProcessingResult.TENANT
                                AND trade.partyAccount  in (:inputIDs)
                                AND optionProcessingResult.CANCELLATIONDATE      between :fromDate and :toDate
                                AND optionProcessingResult.CANCELLATIONDATE     >   optionProcessingResult.BUSINESSDATE
                                AND optionProcessingResult.ACTION               IN  ('ASSIGNMENT' , 'EXERCISE' )

                        )eligibleOPRwithTrade

                        JOIN DM_COMMISSIONFEE_HISTORY DMCF
                            ON  DMCF.ENTITYID              = eligibleOPRwithTrade.ID
                            AND DMCF.ENTITYBUSINESSDATE    = eligibleOPRwithTrade.BUSINESSDATE
                            AND DMCF.TENANT                =  eligibleOPRwithTrade.TENANT
                            AND DMCF.ROOTCAUSEENTITYTYPE   = 'OptionProcessingResult'
        UNION ALL
          SELECT
                   
                    eligibleOPRwithTrade.tradeID      as tradeID,
                    eligibleOPRwithTrade.Quantity      as Quantity,
                    eligibleOPRwithTrade.ID,
                    eligibleOPRwithTrade.BUSINESSDATE,
                    eligibleOPRwithTrade.TENANT,
                    CASE WHEN product.OPTIONSETTLEMENTMETHOD = 'PREMIUM'   THEN realizedPnL.VALUE * eligibleOPRwithTrade.mulFactor 
                     WHEN product.OPTIONSETTLEMENTMETHOD <> 'PREMIUM'  THEN valuation.VALUE * eligibleOPRwithTrade.mulFactor
                     ELSE 0
                    END 
                    as costOrProceeds,
                    mulFactor,
                    (currencys.code) as CURRENCYCODE,
                    case when mulFactor = '-1' then 'Rv Ex/Assn'
                         when mulFactor = '1' and eligibleOPRwithTrade.ACTION in ('EXERCISE','ASSIGNMENT') then 'Exer/Assn'
                         else 'Expiry' End as Legend,
                    (showBusinessDate) as showBusinessDate

                FROM
                        (
                            SELECT
                            optionProcessingResult.QUANTITY,
                            optionProcessingResult.ID, 
                            optionProcessingResult.BUSINESSDATE,
                            optionProcessingResult.BUSINESSDATE as showBusinessDate,
                            optionProcessingResult.TENANT,
                            optionProcessingResult.price,
                            optionProcessingResult.realizedPnl,
                            optionProcessingResult.ACTION,
                            trade.ID as tradeId,
                            trade.instrument,
                            1 AS mulFactor

                            FROM  DM_OPTIONPROCESSINGRESULT optionProcessingResult
                        
                            JOIN DM_DAILYHISTORY_TRADE trade
                                ON  trade.ID            =   optionProcessingResult.TRADE
                                AND trade.STARTDATE     =   optionProcessingResult.BUSINESSDATE
                                AND trade.TENANT        =   optionProcessingResult.TENANT
                                AND trade.partyAccount  in (:inputIDs)
                                AND optionProcessingResult.BUSINESSDATE   between :fromDate and :toDate
                                AND (
                                        optionProcessingResult.CANCELLATIONDATE     IS NULL 
                                    OR  optionProcessingResult.CANCELLATIONDATE     >   optionProcessingResult.BUSINESSDATE
                                    )
                                AND optionProcessingResult.ACTION           IN    
                                      ( 'EXERCISE', 'ASSIGNMENT', 'ABANDONMENT', 'NON ASSIGNMENT', 'NON_ASSIGNMENT' )
                            
                            UNION
                            
                            SELECT
                            optionProcessingResult.QUANTITY,
                            optionProcessingResult.ID,
                            optionProcessingResult.BUSINESSDATE,
                            optionProcessingResult.CANCELLATIONDATE as showBusinessDate,
                            optionProcessingResult.TENANT,
                            optionProcessingResult.price,
                            optionProcessingResult.realizedPnl,
                            optionProcessingResult.ACTION,
                            trade.ID as tradeId,
                            trade.instrument,
                            -1 AS mulFactor

                            FROM  DM_OPTIONPROCESSINGRESULT optionProcessingResult
                            
                            JOIN DM_DAILYHISTORY_TRADE trade
                                ON  trade.ID            =   optionProcessingResult.TRADE
                                AND trade.STARTDATE     =   optionProcessingResult.BUSINESSDATE
                                AND trade.TENANT        =   optionProcessingResult.TENANT
                                AND trade.partyAccount  in (:inputIDs)
                                AND optionProcessingResult.CANCELLATIONDATE      between :fromDate and :toDate
                                AND optionProcessingResult.CANCELLATIONDATE     >   optionProcessingResult.BUSINESSDATE
                                AND optionProcessingResult.ACTION               IN  ('ASSIGNMENT' , 'EXERCISE' )

                        )eligibleOPRwithTrade

                        JOIN DM_INSTRUMENT instrument ON instrument.tenant = eligibleOPRwithTrade.tenant AND instrument.ID = eligibleOPRwithTrade.INSTRUMENT

                        JOIN DM_PRODUCT product ON product.tenant = eligibleOPRwithTrade.tenant AND product.ID = instrument.PRODUCTID
                        
                        JOIN DM_CURRENCY currencys ON currencys.tenant = eligibleOPRwithTrade.tenant AND currencys.ID = product.TRADEPRICECURRENCY

                        LEFT JOIN DM_REALIZEDPNL realizedPnL
                            ON  realizedPnL.ID = eligibleOPRwithTrade.realizedPnl
                            AND realizedPnL.TENANT = eligibleOPRwithTrade.TENANT

                        LEFT JOIN DM_VALUATION valuation
                            ON  valuation.TRADEID =  eligibleOPRwithTrade.tradeId
                            and valuation.OPTIONPROCESSINGRESULTID =  eligibleOPRwithTrade.ID
                            and valuation.ENTITYBUSINESSDATE = eligibleOPRwithTrade.BUSINESSDATE
                            AND valuation.VALUATIONMETHODTYPE = 'PREMIUM'
                            AND valuation.TENANT = eligibleOPRwithTrade.tenant
                    )eligibleOPRWithCostOrProceeds

                  group by eligibleOPRWithCostOrProceeds.ID,
                          eligibleOPRWithCostOrProceeds.BUSINESSDATE,
                          eligibleOPRWithCostOrProceeds.TENANT,
                          eligibleOPRWithCostOrProceeds.Legend,
                          eligibleOPRWithCostOrProceeds.currencycode
    ) shortListedOPR

    join DM_DAILYHISTORY_TRADE tradeIn
        on  tradeIn.id        = shortListedOPR.tradeID
        AND tradeIn.STARTDATE = shortListedOPR.BUSINESSDATE
        AND tradeIn.TENANT    = shortListedOPR.TENANT

    JOIN DM_REGULATORYCATEGORY regcat ON regcat.tenant = shortListedOPR.tenant AND regcat.ID = tradeIn.REGULATORYCATEGORY

    JOIN DM_INSTRUMENT instrument ON instrument.tenant = shortListedOPR.tenant AND instrument.ID = tradeIn.INSTRUMENT

    JOIN DM_PRODUCT product ON product.tenant = shortListedOPR.tenant AND product.ID = instrument.PRODUCTID
	
UNION ALL 

 select  
    tradeIn.partyAccount                                         AS inputID,
    CASE WHEN tradeIn.direction='BUY'  THEN shortListedFPR.quantity END AS bQty,
    CASE WHEN tradeIn.direction='SELL' THEN shortListedFPR.quantity END AS sQty,
    shortListedFPR.SETTLEMENTDATE                                     AS businessDate,
    CASE
        WHEN product.PRODUCTTYPE = 'FUTURE'
        THEN ((CASE WHEN tradein.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(tradeIn.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') )
        ELSE ((CASE WHEN tradein.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(tradein.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') || ' ' || COALESCE(instrument.STRIKEPRICE,0.0) || ' ' || COALESCE(instrument.OPTIONTYPE,''))
    END as contractDescription,
    shortListedFPR.LEGEND as LEGEND,
    shortListedFPR.CURRENCYCODE                                  as tradePriceCurCode,
    regcat.NAME                                                  as optionPremiumRegCategory,
    shortListedFPR.costOrProceeds                                as costOrProceeds,
    tradein.trdTypes                                             as trdTypes
    from
    (

        select            eligibleFPRWithCostOrProceeds.ID,
                          MAX(eligibleFPRWithCostOrProceeds.tradeID) as tradeID,
                          MAX(eligibleFPRWithCostOrProceeds.QUANTITY) as QUANTITY,
                          eligibleFPRWithCostOrProceeds.SETTLEMENTDATE,
                          eligibleFPRWithCostOrProceeds.TENANT,
                          MAX(eligibleFPRWithCostOrProceeds.Legend) as Legend,
                          eligibleFPRWithCostOrProceeds.currencycode,
                          sum(eligibleFPRWithCostOrProceeds.costOrProceeds) as costOrProceeds
                          from 
        (
          SELECT
                    eligibleFPRwithTrade.tradeID      as tradeID,
                    eligibleFPRwithTrade.Quantity      as Quantity,
                    eligibleFPRwithTrade.ID,
                    eligibleFPRwithTrade.SETTLEMENTDATE,
                    eligibleFPRwithTrade.TENANT,
                    DMCF.AMOUNT * eligibleFPRwithTrade.mulFactor as costOrProceeds,
                    mulFactor,
                    (DMCF.CURRENCYCODE) as CURRENCYCODE,
                    case 
                         when eligibleFPRwithTrade.DELIVERYMETHOD = 'PHYSICAL_DELIVERY' then 'Delivery'
                         else 'Expiry' End as Legend

                FROM
                        (
                            SELECT
                            futureProcessingResult.QUANTITY,
                            futureProcessingResult.ID, 
                            futureProcessingResult.SETTLEMENTDATE,
                            futureProcessingResult.TENANT,
                            futureProcessingResult.realizedPnl,
                            futureProcessingResult.DELIVERYMETHOD,
                            trade.ID as tradeId,
                            -1 AS mulFactor

                            FROM  DM_FUTUREPROCESSINGRESULT futureProcessingResult
                        
                            JOIN DM_DAILYHISTORY_TRADE trade
                                ON  trade.ID            =   futureProcessingResult.TRADE
                                AND trade.STARTDATE     =   futureProcessingResult.SETTLEMENTDATE
                                AND trade.TENANT        =   futureProcessingResult.TENANT
                                AND trade.partyAccount  in (:inputIDs)
                                AND futureProcessingResult.SETTLEMENTDATE   between :fromDate and :toDate
                                AND futureProcessingResult.DELIVERYMETHOD           IN    
                                      ( 'CASH_SETTLEMENT', 'PHYSICAL_DELIVERY' )
                            

                        )eligibleFPRwithTrade

                        JOIN DM_COMMISSIONFEE_HISTORY DMCF
                            ON  DMCF.ENTITYID              = eligibleFPRwithTrade.ID
                            AND DMCF.ENTITYBUSINESSDATE    = eligibleFPRwithTrade.SETTLEMENTDATE
                            AND DMCF.TENANT                =  eligibleFPRwithTrade.TENANT
                            AND DMCF.ROOTCAUSEENTITYTYPE   = 'FutureProcessingResult'
        UNION ALL
          SELECT
                    eligibleFPRwithTrade.tradeID      as tradeID,
                    eligibleFPRwithTrade.Quantity      as Quantity,
                    eligibleFPRwithTrade.ID,
                    eligibleFPRwithTrade.SETTLEMENTDATE,
                    eligibleFPRwithTrade.TENANT,
                    realizedPnL.VALUE * eligibleFPRwithTrade.mulFactor as costOrProceeds,
                    mulFactor,
                    (currencys.CODE) as CURRENCYCODE,
                    case 
                         when eligibleFPRwithTrade.DELIVERYMETHOD = 'PHYSICAL_DELIVERY' then 'Delivery'
                         else 'Expiry' End as Legend

                FROM
                        (
                            SELECT
                            futureProcessingResult.QUANTITY,
                            futureProcessingResult.ID, 
                            futureProcessingResult.SETTLEMENTDATE,
                            futureProcessingResult.TENANT,
                            futureProcessingResult.realizedPnl,
                            futureProcessingResult.DELIVERYMETHOD,
                            trade.ID as tradeId,
                            trade.instrument,
                            1 AS mulFactor

                            FROM  DM_FUTUREPROCESSINGRESULT futureProcessingResult
                        
                            JOIN DM_DAILYHISTORY_TRADE trade
                                ON  trade.ID            =   futureProcessingResult.TRADE
                                AND trade.STARTDATE     =   futureProcessingResult.SETTLEMENTDATE
                                AND trade.TENANT        =   futureProcessingResult.TENANT
                                AND trade.partyAccount  in (:inputIDs)
                                AND futureProcessingResult.SETTLEMENTDATE   between :fromDate and :toDate
                                AND futureProcessingResult.DELIVERYMETHOD           IN    
                                      ( 'CASH_SETTLEMENT', 'PHYSICAL_DELIVERY' )
                            

                        )eligibleFPRwithTrade

                        JOIN DM_INSTRUMENT instrument ON instrument.tenant = eligibleFPRwithTrade.tenant AND instrument.ID = eligibleFPRwithTrade.INSTRUMENT

                        JOIN DM_PRODUCT product ON product.tenant = eligibleFPRwithTrade.tenant AND product.ID = instrument.PRODUCTID
                        
                        JOIN DM_CURRENCY currencys ON currencys.tenant = eligibleFPRwithTrade.tenant AND currencys.ID = product.TRADEPRICECURRENCY

                        LEFT JOIN DM_REALIZEDPNL realizedPnL
                            ON  realizedPnL.ID = eligibleFPRwithTrade.realizedPnl
                            AND realizedPnL.TENANT = eligibleFPRwithTrade.TENANT


                    )eligibleFPRWithCostOrProceeds

                  group by eligibleFPRWithCostOrProceeds.ID,
                          eligibleFPRWithCostOrProceeds.SETTLEMENTDATE,
                          eligibleFPRWithCostOrProceeds.TENANT,
                         --  eligibleFPRWithCostOrProceeds.Legend,
                          eligibleFPRWithCostOrProceeds.currencycode
    ) shortListedFPR

    join DM_DAILYHISTORY_TRADE tradeIn
        on  tradeIn.id        = shortListedFPR.tradeID
        AND tradeIn.STARTDATE = shortListedFPR.SETTLEMENTDATE
        AND tradeIn.TENANT    = shortListedFPR.TENANT

    JOIN DM_REGULATORYCATEGORY regcat ON regcat.tenant = shortListedFPR.tenant AND regcat.ID = tradeIn.REGULATORYCATEGORY

    JOIN DM_INSTRUMENT instrument ON instrument.tenant = shortListedFPR.tenant AND instrument.ID = tradeIn.INSTRUMENT

    JOIN DM_PRODUCT product ON product.tenant = shortListedFPR.tenant AND product.ID = instrument.PRODUCTID

UNION ALL

select
    inputID,
    sum(coalesce(bQty, 0 )) as bQty,
    sum(coalesce(sQty, 0 )) as sQty,
    cast(businessDate as date)businessDate,
    contractDescription,
    LEGEND,
    tradePriceCurCode,
    optionPremiumRegCategory,
    sum(costOrProceeds) as costOrProceeds,
    null as trdTypes

from
	(

/*P&S*/

		SELECT
		    trade.PARTYACCOUNT as inputID,
			0 AS init,
			(CASE WHEN trade.direction='BUY' THEN offsetPair.OFFSETQUANTITY END) AS bQty,
			(CASE WHEN trade.direction='SELL' THEN offsetPair.OFFSETQUANTITY END) AS sQty,
			offsetPair.BUSINESSDATE as businessDate,
            (CASE
        	WHEN product.PRODUCTTYPE = 'FUTURE'
        	THEN ((CASE WHEN trade.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(trade.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') )
        	ELSE ((CASE WHEN trade.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(trade.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') || ' ' || COALESCE(instrument.STRIKEPRICE,0.0) || ' ' || COALESCE(instrument.OPTIONTYPE,''))
        	END) AS contractDescription,
			'P&S' AS LEGEND,
			(currencys.CODE) AS tradePriceCurCode,
			(regcat.NAME) AS optionPremiumRegCategory,
			(realizedPnL.VALUE/2) as costOrProceeds,
			null as trdTypes

		FROM DM_OFFSETPAIR offsetPair
			JOIN DM_TRADE trade ON (trade.ID = offsetPair.BUYTRADE) AND trade.TENANT = offsetPair.TENANT AND trade.PARTYACCOUNT in (:inputIDs)
			JOIN DM_INSTRUMENT instrument ON instrument.ID = trade.INSTRUMENT  AND instrument.TENANT = trade.TENANT
			JOIN DM_PRODUCT product ON product.ID = instrument.PRODUCTID AND product.TENANT = trade.TENANT
			JOIN DM_REGULATORYCATEGORY regcat ON regcat.ID = trade.REGULATORYCATEGORY AND regcat.tenant = trade.tenant
			JOIN DM_CURRENCY currencys ON currencys.ID = product.TRADEPRICECURRENCY AND currencys.TENANT = trade.TENANT
			LEFT JOIN DM_REALIZEDPNL realizedPnL ON realizedPnL.ID = offsetPair.REALIZEDPNL AND realizedPnL.TENANT = trade.TENANT AND realizedPnL.BUSINESSDATE = offsetPair.BUSINESSDATE AND realizedPnL.TYPE='OffsetPairRealizedPnL'

		WHERE
			:flag = 'P' AND
			offsetPair.BUSINESSDATE BETWEEN :fromDate AND :toDate AND
			(offsetPair.CANCELLATIONDATE IS NULL OR offsetPair.CANCELLATIONDATE > :toDate)

union all


		SELECT
		    trade.PARTYACCOUNT as inputID,
			0 AS init,
			(CASE WHEN trade.direction='BUY' THEN offsetPair.OFFSETQUANTITY END) AS bQty,
			(CASE WHEN trade.direction='SELL' THEN offsetPair.OFFSETQUANTITY END) AS sQty,
			offsetPair.BUSINESSDATE as businessDate,
            (CASE
        	WHEN product.PRODUCTTYPE = 'FUTURE'
        	THEN ((CASE WHEN trade.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(trade.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') )
        	ELSE ((CASE WHEN trade.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(trade.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') || ' ' || COALESCE(instrument.STRIKEPRICE,0.0) || ' ' || COALESCE(instrument.OPTIONTYPE,''))
        	END) AS contractDescription,
			'P&S' AS LEGEND,
			(currencys.CODE) AS tradePriceCurCode,
			(regcat.NAME) AS optionPremiumRegCategory,
			(realizedPnL.VALUE/2) as costOrProceeds,
			null as trdTypes

		FROM DM_OFFSETPAIR offsetPair
			JOIN DM_TRADE trade ON (trade.ID = offsetPair.SELLTRADE) AND trade.TENANT = offsetPair.TENANT AND trade.PARTYACCOUNT in (:inputIDs)
			JOIN DM_INSTRUMENT instrument ON instrument.ID = trade.INSTRUMENT  AND instrument.TENANT = trade.TENANT
			JOIN DM_PRODUCT product ON product.ID = instrument.PRODUCTID AND product.TENANT = trade.TENANT
			JOIN DM_REGULATORYCATEGORY regcat ON regcat.ID = trade.REGULATORYCATEGORY AND regcat.tenant = trade.tenant
			JOIN DM_CURRENCY currencys ON currencys.ID = product.TRADEPRICECURRENCY AND currencys.TENANT = trade.TENANT
			LEFT JOIN DM_REALIZEDPNL realizedPnL ON realizedPnL.ID = offsetPair.REALIZEDPNL AND realizedPnL.TENANT = trade.TENANT AND realizedPnL.BUSINESSDATE = offsetPair.BUSINESSDATE AND realizedPnL.TYPE='OffsetPairRealizedPnL'

		WHERE
			:flag = 'P' AND
			offsetPair.BUSINESSDATE BETWEEN :fromDate AND :toDate AND
			(offsetPair.CANCELLATIONDATE IS NULL OR offsetPair.CANCELLATIONDATE > :toDate)

union all



/*P&S Rev*/
		SELECT
		    trade.PARTYACCOUNT as inputID,
		    0 AS init,
			(CASE WHEN trade.direction='BUY' THEN offsetPair.OFFSETQUANTITY END) AS bQty,
			(CASE WHEN trade.direction='SELL' THEN offsetPair.OFFSETQUANTITY END) AS sQty,
			offsetPair.BUSINESSDATE as businessDate,
			 (CASE
        		WHEN product.PRODUCTTYPE = 'FUTURE'
        		THEN ((CASE WHEN trade.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(trade.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') )
        		ELSE ((CASE WHEN trade.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(trade.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') || ' ' || COALESCE(instrument.STRIKEPRICE,0.0) || ' ' || COALESCE(instrument.OPTIONTYPE,''))
        		END) AS contractDescription,
			'P&S Rev' AS LEGEND,
			(currencys.CODE) AS tradePriceCurCode,
			(regcat.NAME) AS optionPremiumRegCategory,
			(realizedPnL.VALUE/-2) as costOrProceeds,
			null as trdTypes

		FROM DM_OFFSETPAIR offsetPair

		    JOIN DM_DAILYHISTORY_TRADE trade ON offsetPair.tenant = trade.tenant
            AND (trade.ID = offsetPair.BUYTRADE)
            AND trade.PARTYACCOUNT in (:inputIDs)
            AND trade.STARTDATE = offsetPair.CANCELLATIONDATE
			JOIN DM_INSTRUMENT instrument ON instrument.ID = trade.INSTRUMENT  AND instrument.TENANT = trade.TENANT
			JOIN DM_PRODUCT product ON product.ID = instrument.PRODUCTID AND product.TENANT = trade.TENANT
			JOIN DM_REGULATORYCATEGORY regcat ON regcat.ID = trade.REGULATORYCATEGORY AND regcat.tenant = trade.tenant
			JOIN DM_CURRENCY currencys ON currencys.ID = product.TRADEPRICECURRENCY AND currencys.TENANT = trade.TENANT
			LEFT JOIN DM_REALIZEDPNL realizedPnL ON realizedPnL.ID = offsetPair.REALIZEDPNL AND realizedPnL.TENANT = trade.TENANT AND realizedPnL.BUSINESSDATE = offsetPair.BUSINESSDATE AND realizedPnL.TYPE='OffsetPairRealizedPnL'

		WHERE
			:flag = 'P' AND
			offsetPair.CANCELLATIONDATE BETWEEN :fromDate AND :toDate AND offsetPair.BUSINESSDATE < :toDate

union all



		SELECT
		    trade.PARTYACCOUNT as inputID,
		    0 AS init,
			(CASE WHEN trade.direction='BUY' THEN offsetPair.OFFSETQUANTITY END) AS bQty,
			(CASE WHEN trade.direction='SELL' THEN offsetPair.OFFSETQUANTITY END) AS sQty,
			offsetPair.BUSINESSDATE as businessDate,
			 (CASE
        		WHEN product.PRODUCTTYPE = 'FUTURE'
        		THEN ((CASE WHEN trade.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(trade.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') )
        		ELSE ((CASE WHEN trade.USELOOKALIKEATTRIBUTE = 'YES' THEN product.STATEMENTDESCRIPTION ELSE (COALESCE(trade.EXCHANGENAME,'') || ' ' || product.DESCRIPTION) END) || ' ' || COALESCE(instrument.MONTHMATURITYDATE,'') || ' ' || COALESCE(instrument.STRIKEPRICE,0.0) || ' ' || COALESCE(instrument.OPTIONTYPE,''))
        		END) AS contractDescription,
			'P&S Rev' AS LEGEND,
			(currencys.CODE) AS tradePriceCurCode,
			(regcat.NAME) AS optionPremiumRegCategory,
			(realizedPnL.VALUE/-2) as costOrProceeds,
			null as trdTypes

		FROM DM_OFFSETPAIR offsetPair

		    JOIN DM_DAILYHISTORY_TRADE trade ON offsetPair.tenant = trade.tenant
            AND (trade.ID = offsetPair.SELLTRADE)
            AND trade.PARTYACCOUNT in (:inputIDs)
            AND trade.STARTDATE = offsetPair.CANCELLATIONDATE
			JOIN DM_INSTRUMENT instrument ON instrument.ID = trade.INSTRUMENT  AND instrument.TENANT = trade.TENANT
			JOIN DM_PRODUCT product ON product.ID = instrument.PRODUCTID AND product.TENANT = trade.TENANT
			JOIN DM_REGULATORYCATEGORY regcat ON regcat.ID = trade.REGULATORYCATEGORY AND regcat.tenant = trade.tenant
			JOIN DM_CURRENCY currencys ON currencys.ID = product.TRADEPRICECURRENCY AND currencys.TENANT = trade.TENANT
			LEFT JOIN DM_REALIZEDPNL realizedPnL ON realizedPnL.ID = offsetPair.REALIZEDPNL AND realizedPnL.TENANT = trade.TENANT AND realizedPnL.BUSINESSDATE = offsetPair.BUSINESSDATE AND realizedPnL.TYPE='OffsetPairRealizedPnL'

		WHERE
			:flag = 'P' AND
			offsetPair.CANCELLATIONDATE BETWEEN :fromDate AND :toDate AND offsetPair.BUSINESSDATE < :toDate

union all




	/*Collateral*/
	SELECT
	    case
            when FROMACCOUNTID in (:inputIDs) then FROMACCOUNTID
            when TOACCOUNTID in (:inputIDs) then TOACCOUNTID
            end as inputID,
		0 AS init,
		null AS bQty,
		null AS sQty,
		(TRANSACTIONDATE) as businessDate,
		MOVEMENTSUBTYPENAME AS contractDescription,
		'Collateral' AS LEGEND,
		(case when FROMACCOUNTID in (:inputIDs) then FROMACCOUNTCURRENCYCODE else TOACCOUNTCURRENCYCODE END) AS tradePriceCurCode,
		(case when FROMACCOUNTID in (:inputIDs) then FROMACCOUNTREGULATORYCATEGORY else TOACCOUNTREGULATORYCATEGORY END) AS optionPremiumRegCategory,
		CASE WHEN((TOACCOUNTID in (:inputIDs) AND DIRECTION = 'OUT' AND REVERSAL = 0)) THEN (AMOUNT)*(-1)
			WHEN((TOACCOUNTID in (:inputIDs) AND DIRECTION = 'IN'  AND REVERSAL = 0)) THEN AMOUNT
			WHEN((TOACCOUNTID in (:inputIDs) AND DIRECTION = 'OUT' AND REVERSAL = 1)) THEN AMOUNT
			WHEN((TOACCOUNTID in (:inputIDs) AND DIRECTION = 'IN'  AND REVERSAL = 1)) THEN (AMOUNT)*(-1)
		END AS costOrProceeds,
		null as trdTypes

	FROM
		DM_CASHMOVEMENT

	WHERE
		(BUSINESSDATE BETWEEN :fromDate AND :toDate OR COALESCE(LASTCHANGEDDATE, DATE '9999-01-01') BETWEEN :fromDate AND :toDate)
		AND MOVEMENTTYPENAME = 'Cover'
		AND (FROMACCOUNTID in (:inputIDs) OR TOACCOUNTID in (:inputIDs))
		AND BUSINESSDATE <> coalesce(LASTCHANGEDDATE, DATE '9999-01-01')

	union all

	/*Adjust/Cash*/
	select inputID, init, bQty, sQty, businessDate, contractDescription, LEGEND, tradePriceCurCode, optionPremiumRegCategory, costOrProceeds, trdTypes from
		(select
        case
			when MOVEMENTSUBTYPENAME in ('Account Cash Transfer','Regulatory Cash Transfer') and FROMACCOUNTID in (:inputIDs) then FROMACCOUNTID
            when FROMACCOUNTID in (:inputIDs) then FROMACCOUNTID
            end as inputID,
        0 AS init,
		null AS bQty,
		null AS sQty,
		BUSINESSDATE AS businessDate,
		MOVEMENTSUBTYPENAME AS contractDescription,
		CASE WHEN (MOVEMENTTYPENAME = 'Charge' OR MOVEMENTTYPENAME = 'Adjustment')  THEN 'Adjust'
			 WHEN MOVEMENTTYPENAME = 'Cash' then 'Cash'
		END AS LEGEND,
		(case when FROMACCOUNTID in (:inputIDs) then FROMACCOUNTCURRENCYCODE else TOACCOUNTCURRENCYCODE END) AS tradePriceCurCode,
		(case when FROMACCOUNTID in (:inputIDs) then FROMACCOUNTREGULATORYCATEGORY else TOACCOUNTREGULATORYCATEGORY END) AS optionPremiumRegCategory,
		case
			when MOVEMENTSUBTYPENAME in ('Account Cash Transfer','Regulatory Cash Transfer') and FROMACCOUNTID in (:inputIDs) AND DMC.REVERSAL = 0 then AMOUNT * (-1)
			when MOVEMENTSUBTYPENAME in ('Account Cash Transfer','Regulatory Cash Transfer') and FROMACCOUNTID in (:inputIDs) AND DMC.REVERSAL = 1 then AMOUNT

			when MOVEMENTSUBTYPENAME not in ('Account Cash Transfer','Regulatory Cash Transfer') and direction = 'IN' AND REVERSAL = 0  then AMOUNT
			when MOVEMENTSUBTYPENAME not in ('Account Cash Transfer','Regulatory Cash Transfer') and direction = 'IN' AND REVERSAL = 1  then AMOUNT * (-1)

               when MOVEMENTSUBTYPENAME not in ('Account Cash Transfer','Regulatory Cash Transfer') and direction = 'OUT' AND REVERSAL = 0  then AMOUNT * (-1)
			when MOVEMENTSUBTYPENAME not in ('Account Cash Transfer','Regulatory Cash Transfer') and direction = 'OUT' AND REVERSAL = 1  then AMOUNT

    	END as costOrProceeds,
    	null as trdTypes
	from DM_CASHMOVEMENT DMC
		 LEFT JOIN DM_MOVEMENTPREDEFINEDDESCRIPTION DMMPD on (DMC.tenant= DMMPD.tenant and DMC.MOVEMENTPREDEFINEDDESCRIPTION = DMMPD.id and DMC.MOVEMENTSUBTYPE = DMMPD.MOVEMENTSUBTYPE)
	where
			(BUSINESSDATE BETWEEN :fromDate AND :toDate or COALESCE(LASTCHANGEDDATE, DATE '9999-01-01')  BETWEEN :fromDate AND :toDate ) AND
			(FROMACCOUNTID in (:inputIDs)) AND
			MOVEMENTTYPENAME IN ('Charge','Adjustment','Cash')
			AND upper(MOVEMENTSUBTYPENAME) NOT LIKE '%COUNTERPARTY%'
			AND BUSINESSDATE <> COALESCE(LASTCHANGEDDATE, DATE '9999-01-01') /*This condition is added because client doesent want to see record if reversal happened on same day*/

	UNION

	select
        case
			when MOVEMENTSUBTYPENAME in ('Account Cash Transfer','Regulatory Cash Transfer') and TOACCOUNTID in (:inputIDs) then TOACCOUNTID
            when TOACCOUNTID in (:inputIDs) then TOACCOUNTID
            end as inputID,
        0 AS init,
		null AS bQty,
		null AS sQty,
		BUSINESSDATE AS businessDate,
		MOVEMENTSUBTYPENAME AS contractDescription,
		CASE WHEN (MOVEMENTTYPENAME = 'Charge' OR MOVEMENTTYPENAME = 'Adjustment')  THEN 'Adjust'
			 WHEN MOVEMENTTYPENAME = 'Cash' then 'Cash'
		END AS LEGEND,
		(case when TOACCOUNTID in (:inputIDs) then TOACCOUNTCURRENCYCODE else FROMACCOUNTCURRENCYCODE END) AS tradePriceCurCode,
		(case when TOACCOUNTID in (:inputIDs) then TOACCOUNTREGULATORYCATEGORY else FROMACCOUNTREGULATORYCATEGORY END) AS optionPremiumRegCategory,
		case
			when MOVEMENTSUBTYPENAME in ('Account Cash Transfer','Regulatory Cash Transfer') and TOACCOUNTID in (:inputIDs) AND DMC.REVERSAL = 0 then AMOUNT
			when MOVEMENTSUBTYPENAME in ('Account Cash Transfer','Regulatory Cash Transfer') and TOACCOUNTID in (:inputIDs) AND DMC.REVERSAL = 1 then AMOUNT * (-1)
			when MOVEMENTSUBTYPENAME not in ('Account Cash Transfer','Regulatory Cash Transfer') and direction = 'IN' AND REVERSAL = 0  then AMOUNT
			when MOVEMENTSUBTYPENAME not in ('Account Cash Transfer','Regulatory Cash Transfer') and direction = 'IN' AND REVERSAL = 1  then AMOUNT * (-1)
            when MOVEMENTSUBTYPENAME not in ('Account Cash Transfer','Regulatory Cash Transfer') and direction = 'OUT' AND REVERSAL = 0  then AMOUNT * (-1)
			when MOVEMENTSUBTYPENAME not in ('Account Cash Transfer','Regulatory Cash Transfer') and direction = 'OUT' AND REVERSAL = 1  then AMOUNT
        END as costOrProceeds,
        null as trdTypes
	from DM_CASHMOVEMENT DMC
		 LEFT JOIN DM_MOVEMENTPREDEFINEDDESCRIPTION DMMPD on (DMC.tenant= DMMPD.tenant and DMC.MOVEMENTPREDEFINEDDESCRIPTION = DMMPD.id and DMC.MOVEMENTSUBTYPE = DMMPD.MOVEMENTSUBTYPE)
	where
			(BUSINESSDATE BETWEEN :fromDate AND :toDate or COALESCE(LASTCHANGEDDATE, DATE '9999-01-01')  BETWEEN :fromDate AND :toDate ) AND
			(TOACCOUNTID in (:inputIDs)) AND
			MOVEMENTTYPENAME IN ('Charge','Adjustment','Cash')
			AND upper(MOVEMENTSUBTYPENAME) NOT LIKE '%COUNTERPARTY%'
			AND BUSINESSDATE <> COALESCE(LASTCHANGEDDATE, DATE '9999-01-01') /*This condition is added because client doesent want to see record if reversal happened on same day*/
	) cashadjustments

	/*Delivery Receipts (New Section added under STI-10197)*/
	UNION ALL

	SELECT
	    deliveryReceipt.ACCOUNT as inputID,
		0 AS init,
    		CASE WHEN deliveryReceipt.LONGORSHORT = 'LONG' THEN deliveryReceipt.QUANTITY END AS bQty,
		CASE WHEN deliveryReceipt.LONGORSHORT = 'SHORT' THEN deliveryReceipt.QUANTITY END AS sQty,
    		deliveryReceipt.BUSINESSDATE AS businessDate,
    		COALESCE(deliveryReceipt.DESCRIPTION, deliveryReceipt.INSTRUMENT) AS contractDescription,
    		'Receipt' AS LEGEND,
    		currency.CODE AS tradePriceCurCode,
    		'' AS optionPremiumRegCategory,
		deliveryReceipt.VALUATEDAMOUNT AS costOrProceeds,
		null as trdTypes
	FROM
		DM_DELIVERYRECEIPT  deliveryReceipt


	   	JOIN DM_CURRENCY  currency
    		ON currency.TENANT = deliveryReceipt.TENANT AND currency.ID = deliveryReceipt.CURRENCY

	WHERE
		deliveryReceipt.BUSINESSDATE BETWEEN :fromDate AND :toDate
		and deliveryReceipt.ACCOUNT	in (:inputIDs)
	/*Delivery Receipts (New Section added under STI-10197)*/


	)temp

group by
    inputID,
    businessDate,
    contractDescription,
    LEGEND,
    tradePriceCurCode,
    optionPremiumRegCategory

ORDER BY
    inputID,
    optionPremiumRegCategory,
    tradePriceCurCode,
    businessDate,
    contractDescription,
    bQty,
    sQty,
    LEGEND,
    costOrProceeds
