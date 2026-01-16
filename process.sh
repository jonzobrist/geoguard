#!/usr/bin/env bash
# This script clones https://github.com/mkorthof/ipset-country and re-arranges its data for use by the tool
#
IPBLOCKS_GIT="https://github.com/mkorthof/ipset-country"
D_DEST_DIR="${HOME}/src/ipblocks"
DEST_DIR="${DEST_DIR:-${D_DEST_DIR}}"
TEMP_DIR=$(mktemp -d)
git clone ${IPBLOCKS_GIT} ${TEMP_DIR}
COUNTRY_DIR="${IPSET_DIR}/country-ip-blocks/country"
pushd ${COUNTRY_DIR}
mkdir -p ${DEST_DIR}/{ipv4,ipv6}
for C in $(/bin/ls -1)
 do
   echo ${C}
   /bin/cp ${C}/ipv4-aggregated.txt ~/src/ipblocks/ipv4/${C}.cidr
   cp ${C}/ipv6-aggregated.txt ~/src/ipblocks/ipv6/${C}.cidr
done
popd
