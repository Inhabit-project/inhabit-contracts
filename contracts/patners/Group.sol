// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../security/Administered.sol";

contract Group is Administered {
    /// Struct de Grupo
    struct GroupStruct {
        string group;
        bool state;
        Shared[] arrayShared;
    }

    /// Struct de Grupo a distribuir
    struct Shared {
        address addr;
        uint256 pcng;
    }

    uint256 public _totalPcng = 10000;

    event Distributed(address indexed beneficiary, uint256 amount);

    /// Mapping de Grupos
    mapping(string => GroupStruct) public groups;

    /// Mapping de almacenamiento de grupos
    mapping(uint256 => string) public groupList;

    /// Contador de grupos registrados
    uint256 public _totalGroup = 0;

    function addGroup(
        string calldata _group,
        bool _state,
        Shared[] memory _groups
    ) public onlyAdmin {
        require(!groupExist(_group), "AddGroup: Group Already Stored");
        uint256 thisPcng = 0;
        for (uint i = 0; i < _groups.length; i++) {
            thisPcng = thisPcng + _groups[i].pcng;
        }
        require(
            thisPcng <= _totalPcng,
            "AddGroup: The Taximum Percentage Is Exceeded"
        );

        _addGroup(_group, _state, _groups);
    }

    function getGroup(
        string calldata _code
    ) public view returns (GroupStruct memory) {
        return groups[_code];
    }

    function groupExist(string calldata _group) public view returns (bool) {
        return bytes(groups[_group].group).length > 0;
    }

    /// Actualizar estado del grupo
    function updateGroupStatus(
        string calldata _code,
        bool _nw
    ) public onlyAdmin {
        groups[_code].state = _nw;
    }

    /// Eliminar Shared de arreglo de grupo
    function removeSharedOfGroup(
        string calldata _group,
        uint _idx
    ) public onlyAdmin {
        require(
            groupExist(_group),
            "removeSharedOfGroup: Group Not Already Stored"
        );
        require(
            _idx < groups[_group].arrayShared.length,
            "Index out of bounds"
        );

        if (groups[_group].arrayShared.length > 0) {
            groups[_group].arrayShared[_idx] = groups[_group].arrayShared[
                groups[_group].arrayShared.length - 1
            ];
            groups[_group].arrayShared.pop();
        }
    }

    /**
     * @dev add shared of group
     * @param _group group
     * @param _shared shared
     */
    function addSharedOfGroup(
        string calldata _group,
        Shared calldata _shared
    ) public onlyAdmin {
        require(
            groupExist(_group),
            "addSharedOfGroup: Group Not Already Stored"
        );
        groups[_group].arrayShared.push(_shared);
    }

    function updateSharedOfGroup(
        string calldata _group,
        uint8 _ot,
        uint256 _idx,
        Shared memory _shared
    ) public onlyAdmin {
        if (_ot == 1) {
            groups[_group].arrayShared[_idx].addr = _shared.addr;
        } else if (_ot == 2) {
            groups[_group].arrayShared[_idx].pcng = _shared.pcng;
        }
    }

    function _addGroup(
        string calldata _group,
        bool _state,
        Shared[] memory _groups
    ) internal {
        groups[_group].group = _group;
        groups[_group].state = _state;

        for (uint i = 0; i < _groups.length; i++) {
            groups[_group].arrayShared.push(
                Shared(_groups[i].addr, _groups[i].pcng)
            );
        }

        /// Almacenar codigo de grupo en listado de grupos para paginar
        groupList[_totalGroup] = _group;

        _totalGroup++;
    }

    /**
     * @dev  distribution of tokens a group
     * @param _group group
     * @param _amount amount
     * @param _isNative isNative
     * @param tokenAddrs tokenAddrs
     */
    function distribution(
        string calldata _group,
        uint256 _amount,
        bool _isNative,
        address tokenAddrs
    ) public {
        require(groupExist(_group), "distribution: Group Not Already Stored");
        require(
            groups[_group].state == true,
            "distribution: Group Not Already Available"
        );

        uint position = 0;
        GroupStruct memory infoGroup = groups[_group];

        while (position < infoGroup.arrayShared.length) {
            Shared memory _groupShared = infoGroup.arrayShared[position];
            address beneficiaryAddrs = _groupShared.addr;
            uint256 bonus = calculateFee(_amount, _groupShared.pcng);

            sendToken(beneficiaryAddrs, bonus, _isNative, tokenAddrs);
            emit Distributed(beneficiaryAddrs, bonus); // Registrar evento

            position += 1;
        }
    }

    /**
     *
     * @param _addr  address
     * @param _bonus  bonus
     * @param _isNative  isNative
     * @param tokenAddrs  tokenAddrs
     */
    function sendToken(
        address _addr,
        uint256 _bonus,
        bool _isNative,
        address tokenAddrs
    ) internal {
        /// @dev send bonus
        if (_isNative) {
            payable(_addr).transfer(_bonus);
        } else {
            IERC20(tokenAddrs).transfer(_addr, _bonus);
        }
    }

    /**
     *
     * @param amount  amount  total transaction
     * @param porcentaje  porcentaje  fee
     */
    function calculateFee(
        uint256 amount,
        uint256 porcentaje
    ) public pure returns (uint256 fee) {
        return (amount * porcentaje) / 10000;
    }

    /**
     * @dev get group list paginated
     * @param _f from
     * @param _t to
     */
    function getGroupListPaginated(
        uint256 _f,
        uint256 _t
    ) external view returns (GroupStruct[] memory) {
        unchecked {
            require(_t > _f, "Invalid range");
            GroupStruct[] memory _list = new GroupStruct[](_t - _f);
            for (uint i = _f; i < _t; i++) {
                string memory _group = groupList[i];
                _list[i - _f] = groups[_group]; // Ajustar el índice
            }
            return _list;
        }
    }
}
