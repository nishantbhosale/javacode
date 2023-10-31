public Stream<ExpiringOption> getExpiringOptionsByProduct(
      LocalDate reportDate,
      String accountLevel,
      List<String> accountLevelValues,
      List<String> businessCategory,
      List<String> businessUnit,
      Long proxToExpiration,
      String moneyField,
      List<String> exchange,
      List<String> clearingCode,
      List<String> settlementPrice)
      throws SQLException, DataException {

    String query = repo.get(BY_PRODUCT);
    if(dbType.equals(DBType.MYSQL)){
      query = query.replace("(ins.MATURITYDATE - :businessDate)","DATEDIFF(ins.MATURITYDATE, :businessDate)");
    }
    checkMandatoryField(accountLevel, "Account hierarchy level");
    checkMandatoryField(proxToExpiration, "proxToExpiration");
    checkMandatoryField(moneyField, "moneyField");

    if (accountLevelValues.isEmpty()) {
      throw new DataException("Account hierarchy values can not be empty");
    }

    Map<String, Object> namedParams =
        constructParamsProduct(
            reportDate,
            accountLevel,
            accountLevelValues,
            businessCategory,
            businessUnit,
            proxToExpiration,
            moneyField,
            exchange,
            clearingCode,
            settlementPrice);

    return sq.toStream(new SQLQuery(SQLTransformer.transform(dbType, query), namedParams), this::createExpiringOption);
  }
