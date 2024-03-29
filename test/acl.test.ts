import { ROLES_LIBRARY_IDS } from '@iqprotocol/iq-space-protocol';
import { IACL } from '@iqprotocol/iq-space-protocol/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { deployments, ethers } from 'hardhat';
import { ACLAdapter, IQSpace } from '../src';
import { toAccountId } from './helpers/utils';

/**
 * @group integration
 */
describe('ACLAdapter', () => {
  /** Signers */
  let deployer: SignerWithAddress;
  let admin: SignerWithAddress;
  let random: SignerWithAddress;

  /** Contracts */
  let acl: IACL;

  /** SDK */
  let aclAdapter: ACLAdapter;

  /** Data Structs */
  let adminRole: string;
  let supervisorRole: string;
  let listingWizardRole: string;
  let universeWizardRole: string;
  let tokenQuoteSignerRole: string;

  beforeEach(async () => {
    await deployments.fixture();

    deployer = await ethers.getNamedSigner('deployer');
    admin = await ethers.getNamedSigner('admin');
    [random] = await ethers.getUnnamedSigners();

    acl = await ethers.getContract('ACL');

    const iqSpace = await IQSpace.init({ signer: deployer });
    aclAdapter = iqSpace.acl(toAccountId(acl.address));

    adminRole = await acl.adminRole();
    supervisorRole = await acl.supervisorRole();
    listingWizardRole = await acl.listingWizardRole();
    universeWizardRole = await acl.universeWizardRole();
    tokenQuoteSignerRole = await acl.tokenQuoteSignerRole();
  });

  describe('adminRole', () => {
    it('should return admin role bytes', async () => {
      const bytes = await aclAdapter.adminRole();
      expect(bytes).to.be.eq(adminRole);
    });
  });

  describe('supervisorRole', () => {
    it('should return supervisor role bytes', async () => {
      const bytes = await aclAdapter.supervisorRole();
      expect(bytes).to.be.eq(supervisorRole);
    });
  });

  describe('listingWizardRole', () => {
    it('should return listing wizard role bytes', async () => {
      const bytes = await aclAdapter.listingWizardRole();
      expect(bytes).to.be.eq(listingWizardRole);
    });
  });

  describe('universeWizardRole', () => {
    it('should return universe wizard role bytes', async () => {
      const bytes = await aclAdapter.universeWizardRole();
      expect(bytes).to.be.eq(universeWizardRole);
    });
  });

  describe('tokenQuoteSignerRole', () => {
    it('should return token quote signer role bytes', async () => {
      const bytes = await aclAdapter.tokenQuoteSignerRole();
      expect(bytes).to.be.eq(tokenQuoteSignerRole);
    });
  });

  describe('grantRole', () => {
    it('should grant role', async () => {
      await aclAdapter.grantRole(ROLES_LIBRARY_IDS.SUPERVISOR_ROLE, toAccountId(random.address));
      expect(await acl.hasRole(ROLES_LIBRARY_IDS.SUPERVISOR_ROLE, random.address)).to.be.eq(true);
    });
  });

  describe('revokeRole', () => {
    beforeEach(async () => {
      await acl.grantRole(ROLES_LIBRARY_IDS.SUPERVISOR_ROLE, random.address);
    });

    it('should revoke role', async () => {
      await aclAdapter.revokeRole(ROLES_LIBRARY_IDS.SUPERVISOR_ROLE, toAccountId(random.address));
      expect(await acl.hasRole(ROLES_LIBRARY_IDS.SUPERVISOR_ROLE, random.address)).to.be.eq(false);
    });
  });

  describe('renounceRole', () => {
    beforeEach(async () => {
      await acl.grantRole(ROLES_LIBRARY_IDS.LISTING_WIZARD_ROLE, deployer.address);
    });

    it('should renounce role', async () => {
      await aclAdapter.renounceRole(ROLES_LIBRARY_IDS.LISTING_WIZARD_ROLE);
      expect(await acl.hasRole(ROLES_LIBRARY_IDS.LISTING_WIZARD_ROLE, deployer.address)).to.be.eq(false);
    });
  });

  describe('hasRole', () => {
    describe('when user does not have role', () => {
      it('should return false', async () => {
        expect(await aclAdapter.hasRole(ROLES_LIBRARY_IDS.LISTING_WIZARD_ROLE, toAccountId(deployer.address))).to.be.eq(
          false,
        );
      });
    });

    describe('when user has role', () => {
      beforeEach(async () => {
        await acl.grantRole(ROLES_LIBRARY_IDS.LISTING_WIZARD_ROLE, deployer.address);
      });

      it('should return true', async () => {
        expect(await aclAdapter.hasRole(ROLES_LIBRARY_IDS.LISTING_WIZARD_ROLE, toAccountId(deployer.address))).to.be.eq(
          true,
        );
      });
    });
  });

  describe('getRoleAdmin', () => {
    it('should return role admin', async () => {
      expect(await aclAdapter.getRoleAdmin(ROLES_LIBRARY_IDS.ADMIN_ROLE)).to.be.eq(ROLES_LIBRARY_IDS.ADMIN_ROLE);
    });
  });

  describe('getRoleMembers', () => {
    beforeEach(async () => {
      await acl.grantRole(ROLES_LIBRARY_IDS.ADMIN_ROLE, admin.address);
    });

    it('should return role members', async () => {
      const members = await aclAdapter.getRoleMembers(ROLES_LIBRARY_IDS.ADMIN_ROLE);
      expect(members).to.be.deep.equal([toAccountId(deployer.address), toAccountId(admin.address)]);
    });
  });
});
