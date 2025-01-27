const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
  const { expect } = require("chai");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { ethers } = require("hardhat");
  const { BigNumber, utils } = require("ethers");
  const { parseEther } = require("ethers/lib/utils");


  describe("Vendor", function () {

    //Se graban los deply y cualquier dato que se vaya a necesitar para los unit test para no repetir el codigo
    async function deployVendor() {
  
      const [owner, address1, address2, address3, address4, address5, address6, address7, address8, address9] =
        await ethers.getSigners();

      const MockErc20Contract = await ethers.getContractFactory("MockErc20");
  
      const MockErc20_1 = await MockErc20Contract.deploy();
  
      const MockErc20_2 = await MockErc20Contract.deploy();

      const MockErc20_3 = await MockErc20Contract.deploy();
  
  
      const vendorContract = await ethers.getContractFactory("VendorV2");
      const vendor = await vendorContract.deploy();
  

  
      return {
        vendor,
        MockErc20_1,
        MockErc20_2,
        MockErc20_3,
        owner,
        address1,
        address2,
        address3,
        address4,
        address5,
        address6, 
        address7, 
        address8, 
        address9
      };
    }
  

    describe("Deployment", function () {

        it("Comprando con un unico patner con 100% y con un erc20", async function () {
            const { vendor, MockErc20_1, MockErc20_2, owner, address1, address2, address9 } = await loadFixture(deployVendor);
    
            await vendor.connect(owner).addUser(owner.address);

            await vendor.connect(owner).addToken(MockErc20_1.address, MockErc20_1.address, 18, true, false);

            await vendor.connect(address1).setPrice(utils.parseEther("1.0"));

            await vendor.connect(owner).addCollection(MockErc20_2.address, utils.parseEther("0.5"), true);

            await vendor.connect(owner).addGroup("group1", true, [{addr: address9.address, pcng: 10000}]);


            await vendor.connect(owner).addGroup("group0", true, [{addr: address1.address, pcng: 10000}]);

            await MockErc20_1.connect(address2).mint(address2.address, utils.parseEther("5.0"));
    
            await MockErc20_1.connect(address2).approve(vendor.address, utils.parseEther("1.0"));

            await vendor.connect(address2).buyWithToken("group0", MockErc20_1.address, 0, utils.parseEther("1.0"));

            expect(
                await MockErc20_1.balanceOf(address1.address)
              ).to.be.equal(utils.parseEther("0.5"));

              expect(
                await MockErc20_1.balanceOf(address9.address)
              ).to.be.equal(utils.parseEther("0.0"));
          });

    


    it("Comprando con 2 patners con 70%, 30% y con un erc20", async function () {
        const { vendor, MockErc20_1, MockErc20_2, owner, address1, address2, address3, address9 } = await loadFixture(deployVendor);

        await vendor.connect(owner).addUser(owner.address);

        await vendor.connect(owner).addToken(MockErc20_1.address, MockErc20_1.address, 18, true, false);

        await vendor.connect(address1).setPrice(utils.parseEther("1.0"));

        await vendor.connect(owner).addCollection(MockErc20_2.address, utils.parseEther("0.5"), true);

        await vendor.connect(owner).addGroup("group1", true, [{addr: address9.address, pcng: 10000}]);

        await vendor.connect(owner).addGroup("group0", true, [{addr: address1.address, pcng: 7000}, {addr: address3.address, pcng: 3000}]);

        await MockErc20_1.connect(address2).mint(address2.address, utils.parseEther("5.0"));

        await MockErc20_1.connect(address2).approve(vendor.address, utils.parseEther("1.0"));

        await vendor.connect(address2).buyWithToken("group0", MockErc20_1.address, 0, utils.parseEther("2.0"));

        expect(
            await MockErc20_1.balanceOf(address1.address)
          ).to.be.equal(utils.parseEther("0.7"));
          expect(
            await MockErc20_1.balanceOf(address3.address)
          ).to.be.equal(utils.parseEther("0.3"));

          expect(
            await MockErc20_1.balanceOf(address9.address)
          ).to.be.equal(utils.parseEther("0.0"));
      });

      it("Comprando con 3 patners con 70%, 15%, 15% y con un erc20", async function () {
        const { vendor, MockErc20_1, MockErc20_2, owner, address1, address2, address3, address4, address9 } = await loadFixture(deployVendor);

        await vendor.connect(owner).addUser(owner.address);

        await vendor.connect(owner).addToken(MockErc20_1.address, MockErc20_1.address, 18, true, false);

        await vendor.connect(owner).addGroup("group1", true, [{addr: address9.address, pcng: 10000}]);

        await vendor.connect(address1).setPrice(utils.parseEther("1.0"));

        await vendor.connect(owner).addCollection(MockErc20_2.address, utils.parseEther("0.5"), true);

        await vendor.connect(owner).addGroup("group0", true, [{addr: address1.address, pcng: 7000}, {addr: address3.address, pcng: 1500}, {addr: address4.address, pcng: 1500}]);

        await MockErc20_1.connect(address2).mint(address2.address, utils.parseEther("5.0"));

        await MockErc20_1.connect(address2).approve(vendor.address, utils.parseEther("1.0"));

        await vendor.connect(address2).buyWithToken("group0", MockErc20_1.address, 0, utils.parseEther("2.0"));

        expect(
            await MockErc20_1.balanceOf(address1.address)
          ).to.be.equal(utils.parseEther("0.7"));
          expect(
            await MockErc20_1.balanceOf(address3.address)
          ).to.be.equal(utils.parseEther("0.15"));
          expect(
            await MockErc20_1.balanceOf(address4.address)
          ).to.be.equal(utils.parseEther("0.15"));

          expect(
            await MockErc20_1.balanceOf(address9.address)
          ).to.be.equal(utils.parseEther("0.0"));
      });


      it("Comprando con un unico patner con 100% y con token nativo", async function () {
        const { vendor, MockErc20_1, MockErc20_2, owner, address1, address2, address3, address9 } = await loadFixture(deployVendor);

        await vendor.connect(owner).addUser(owner.address);

        await vendor.connect(owner).addToken(MockErc20_1.address, MockErc20_1.address, 18, true, true);

        await vendor.connect(owner).setPrice(utils.parseEther("1.0"));

        await vendor.connect(owner).addCollection(MockErc20_2.address, utils.parseEther("0.5"), true);

        await vendor.connect(owner).addGroup("group0", true, [{addr: address1.address, pcng: 10000}]);

        await vendor.connect(address2).buyNative ("group0", 0, MockErc20_1.address, utils.parseEther("1.0"), { value: utils.parseEther("1.0")});

        
        expect(
            await MockErc20_1.nativeTokenBalance(address1.address)
          ).to.be.equal(utils.parseEther("10000.5"));

        expect(
            await MockErc20_1.nativeTokenBalance(address9.address)
          ).to.be.equal(utils.parseEther("10000.0"));
      });

      it("Comprando con 2 patners con 70%, 30%  y con token nativo", async function () {
        const { vendor, MockErc20_1, MockErc20_2, owner, address1, address2, address3, address9 } = await loadFixture(deployVendor);

        await vendor.connect(owner).addUser(owner.address);

        await vendor.connect(owner).addToken(MockErc20_1.address, MockErc20_1.address, 18, true, true);

        await vendor.connect(owner).setPrice(utils.parseEther("1.0"));

        await vendor.connect(owner).addCollection(MockErc20_2.address, utils.parseEther("0.5"), true);

        await vendor.connect(owner).addGroup("group0", true, [{addr: address1.address, pcng: 7000}, {addr: address3.address, pcng: 3000}]);

        await vendor.connect(address2).buyNative ("group0", 0, MockErc20_1.address, utils.parseEther("2.0"), { value: utils.parseEther("2.0")});

        
        expect(
            await MockErc20_1.nativeTokenBalance(address1.address)
          ).to.be.equal(utils.parseEther("10000.7"));

          expect(
            await MockErc20_1.nativeTokenBalance(address3.address)
          ).to.be.equal(utils.parseEther("10000.3"));

        expect(
            await MockErc20_1.nativeTokenBalance(address9.address)
          ).to.be.equal(utils.parseEther("10000.0"));
      });

      it("Comprando con 3 patners con 70%, 15%, 15%  y con token nativo", async function () {
        const { vendor, MockErc20_1, MockErc20_2, owner, address1, address2, address3, address4, address9 } = await loadFixture(deployVendor);

        await vendor.connect(owner).addUser(owner.address);

        await vendor.connect(owner).addToken(MockErc20_1.address, MockErc20_1.address, 18, true, true);

        await vendor.connect(owner).setPrice(utils.parseEther("1.0"));

        await vendor.connect(owner).addCollection(MockErc20_2.address, utils.parseEther("0.5"), true);

        await vendor.connect(owner).addGroup("group0", true, [{addr: address1.address, pcng: 7000}, {addr: address3.address, pcng: 1500}, {addr: address4.address, pcng: 1500}]);

        await vendor.connect(address2).buyNative ("group0", 0, MockErc20_1.address, utils.parseEther("2.0"), { value: utils.parseEther("2.0")});

        
        expect(
            await MockErc20_1.nativeTokenBalance(address1.address)
          ).to.be.equal(utils.parseEther("10000.7"));

          expect(
            await MockErc20_1.nativeTokenBalance(address3.address)
          ).to.be.equal(utils.parseEther("10000.15"));

          expect(
            await MockErc20_1.nativeTokenBalance(address4.address)
          ).to.be.equal(utils.parseEther("10000.15"));

        expect(
            await MockErc20_1.nativeTokenBalance(address9.address)
          ).to.be.equal(utils.parseEther("10000.0"));
      });

      it("Comprando con 3 patners con 70%, 15%, 15% y el grupo off", async function () {
        const { vendor, MockErc20_1, MockErc20_2, MockErc20_3, owner, address1, address2, address3, address4, address9 } = await loadFixture(deployVendor);

        await vendor.connect(owner).addUser(owner.address);

        await vendor.connect(owner).addToken(MockErc20_1.address, MockErc20_1.address, 18, true, true);
        await vendor.connect(owner).addToken(MockErc20_3.address, MockErc20_3.address, 18, true, false);


        await vendor.connect(owner).setPrice(utils.parseEther("1.0"));

        await vendor.connect(owner).addCollection(MockErc20_2.address, utils.parseEther("0.5"), true);

        await vendor.connect(owner).addGroup("group0", false, [{addr: address1.address, pcng: 7000}, {addr: address3.address, pcng: 1500}, {addr: address4.address, pcng: 1500}]);

        await MockErc20_3.connect(address2).mint(address2.address, utils.parseEther("5.0"));

        await MockErc20_3.connect(address2).approve(vendor.address, utils.parseEther("1.0"));

        await expect
        ( vendor.connect(address2).buyNative("group0", 0, MockErc20_1.address, utils.parseEther("2.0"), { value: utils.parseEther("2.0")}))
        .to.be.revertedWith("distribution: Group Not Already Available");

        await expect
        (vendor.connect(address2).buyWithToken("group0", MockErc20_3.address, 0, utils.parseEther("1.0")))
        .to.be.revertedWith("distribution: Group Not Already Available");
      });


      it("Comprando con un grupo que no existe", async function () {
        const { vendor, MockErc20_1, MockErc20_2, MockErc20_3, owner, address1, address2, address3, address4, address9 } = await loadFixture(deployVendor);

        await vendor.connect(owner).addUser(owner.address);

        await vendor.connect(owner).addToken(MockErc20_1.address, MockErc20_1.address, 18, true, true);
        await vendor.connect(owner).addToken(MockErc20_3.address, MockErc20_3.address, 18, true, false);


        await vendor.connect(owner).setPrice(utils.parseEther("1.0"));

        await vendor.connect(owner).addCollection(MockErc20_2.address, utils.parseEther("0.5"), true);

        await MockErc20_3.connect(address2).mint(address2.address, utils.parseEther("5.0"));

        await MockErc20_3.connect(address2).approve(vendor.address, utils.parseEther("1.0"));

        await expect
        ( vendor.connect(address2).buyNative("group0", 0, MockErc20_1.address, utils.parseEther("2.0"), { value: utils.parseEther("2.0")}))
        .to.be.revertedWith("distribution: Group Not Already Stored");

        await expect
        (vendor.connect(address2).buyWithToken("group0", MockErc20_3.address, 0, utils.parseEther("1.0")))
        .to.be.revertedWith("distribution: Group Not Already Stored");
      });

    });

});

 
