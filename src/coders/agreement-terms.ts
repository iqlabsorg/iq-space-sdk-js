import { Rentings } from '@iqprotocol/iq-space-protocol-light/typechain/contracts/metahub/core/IMetahub';
import { AddressTranslator } from '../address-translator';
import { AgreementTerms } from '../types';

export class AgreementTermsCoder {
  /**
   * Encodes agreement terms params structure.
   * @param params
   */
  static encode(translator: AddressTranslator, params: AgreementTerms): Rentings.AgreementTermsStruct {
    const { listingTerms, universeTaxTerms, protocolTaxTerms, paymentTokenData } = params;

    return {
      listingTerms,
      universeTaxTerms,
      protocolTaxTerms,
      paymentTokenData: {
        paymentTokenQuote: paymentTokenData.paymentTokenQuote,
        paymentToken: translator.accountIdToAddress(paymentTokenData.paymentToken),
      },
    };
  }

  /**
   * Decodes agreement terms params structure.
   * @param params
   */
  static decode(translator: AddressTranslator, params: Rentings.AgreementTermsStruct): AgreementTerms {
    const { listingTerms, universeTaxTerms, protocolTaxTerms, paymentTokenData } = params;

    return {
      listingTerms,
      universeTaxTerms,
      protocolTaxTerms,
      paymentTokenData: {
        paymentTokenQuote: paymentTokenData.paymentTokenQuote,
        paymentToken: translator.addressToAccountId(paymentTokenData.paymentToken),
      },
    };
  }
}
